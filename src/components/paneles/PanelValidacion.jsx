
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase-config';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  writeBatch, 
  Timestamp,
  getDoc, // ¡Importante!
  getDocs,
  orderBy, // ¡Importante!
  increment,
  limit
} from 'firebase/firestore';

// --- Sub-componente ReportCard (CORREGIDO) ---
function ReportCard({ report, onApprove, isSubmitting }) {

  // --- ¡CORRECCIÓN DE LÓGICA DE ESTADO! ---
  // Establecemos el estado inicial de forma síncrona.
  // Si no hay reportero, es 'Anónimo' desde el primer render.
  // Si hay, es '...' y el useEffect se encargará de buscarlo.
  const [reporterName, setReporterName] = useState(() => {
    return !report.reportedBy ? 'Anónimo' : '...';
  });

  // --- EFECTO CORREGIDO ---
  // Ahora, el useEffect SOLO se encarga de la lógica ASÍNCRONA.
  // Ya no tiene la llamada síncrona a setReporterName('Anónimo').
  useEffect(() => {
    
    // Si el estado ya es 'Anónimo' (o si ya cargó), no hacemos nada.
    // Solo actuamos si hay un ID y el estado es '...' (pendiente de carga).
    if (report.reportedBy && reporterName === '...') {
      
      const userRef = doc(db, 'users', report.reportedBy);
      const fetchReporterName = async () => {
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setReporterName(userSnap.data().displayName || 'Usuario sin nombre');
          } else {
            setReporterName(`ID: ${report.reportedBy.substring(0, 5)}...`);
          }
        } catch (error) {
          console.error("Error al buscar nombre de reportero:", error);
          setReporterName("Error al cargar nombre");
        }
      };

      fetchReporterName();
    }

  // Vigila 'report.reportedBy' por si cambia (aunque es poco probable)
  // y 'reporterName' para asegurar que solo se ejecute cuando es '...'.
  }, [report.reportedBy, reporterName]); 

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h4 className="font-semibold text-gray-800">{report.name}</h4>
      <p className="text-sm text-gray-600">Tipo: {report.type}</p>
      <p className="text-sm text-gray-500">
        Reportado por: <span className="font-medium text-gray-700">{reporterName}</span>
      </p>
      
      <button
        onClick={() => onApprove(report)}
        disabled={isSubmitting}
        className="mt-3 w-full px-4 py-2 text-sm font-semibold text-white 
                   bg-blue-600 rounded-md shadow-sm hover:bg-blue-700
                   disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Aprobando...' : 'Aprobar (+3 Pts)'}
      </button>
    </div>
  );
}

// --- Componente Principal: PanelValidacion ---
function PanelValidacion({ user }) {
  const [pendingReports, setPendingReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  useEffect(() => {
    const reportsRef = collection(db, 'reports');
    const q = query(
      reportsRef, 
      where('status', '==', 'Pendiente'),
      orderBy('reportedAt', 'asc') 
    );

    setIsLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsList = [];
      snapshot.forEach(doc => {
        reportsList.push({ id: doc.id, ...doc.data() });
      });
      setPendingReports(reportsList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error al escuchar reportes: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe(); 
  }, []); 

  const handleApprove = async (report) => {
    if (isSubmitting) return; 
    setIsSubmitting(true);

    const batch = writeBatch(db);

    try {
      // 1. Actualizar el reporte
      const reportRef = doc(db, 'reports', report.id);
      batch.update(reportRef, {
        status: "Validado",
        validatedBy: user.uid,
        validatedAt: Timestamp.now()
      });

      // 2. Crear el nuevo espacio
      const newSpaceRef = doc(collection(db, 'spaces'));
      batch.set(newSpaceRef, {
        name: report.name,
        type: report.type,
        location: report.location, 
        status: "Validado",
        reportedBy: report.reportedBy,
        validatedBy: user.uid,
        createdAt: report.reportedAt, 
        validatedAt: Timestamp.now()
      });

      // 3. Sumar puntos al Reportero (5 Pts)
      const reporterRef = doc(db, 'users', report.reportedBy);
      batch.update(reporterRef, { points: increment(5) }); // Usar increment

      // 4. Sumar puntos al Validador (3 Pts)
      const validatorRef = doc(db, 'users', user.uid);
      batch.update(validatorRef, { points: increment(3) }); // Usar increment
            // 6. Cerrar Búsquedas pendientes (si aplica)
      const searchesRef = collection(db, 'searchRequests');
      const q = query(
        searchesRef,
        where('status', '==', 'pendiente'),
        where('searchQuery', '==', report.name), //Busca por nombre
        where('searchType', '==', report.type) //Busca por tipo
      );
      // Ejecuta la consulta (esto es asincrono)
      const searchSnapshot = await getDocs(q);
      searchSnapshot.forEach((searchDoc) => {
        const docRef = doc(db, 'searchRequests', searchDoc.id);
        batch.update(docRef, { status: "resuelta" });
      });
      // 5. Escribir en el Log de Actividad
      const logRef = doc(collection(db, 'activity_log'));
      batch.set(logRef, {
        message: `${user.displayName || 'Un validador'} aprobó "${report.name}".`,
        timestamp: Timestamp.now(),
        userId: user.uid,
        action: "validate"
      });


      // Finalmente, comitea el batch
      await batch.commit();
      
    } catch (error) {
      console.error("¡Falló el lote de validación!: ", error);
      alert("Error al aprobar: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-t-2xl shadow-lg z-10"
      initial="collapsed"
      animate={isExpanded ? "expanded" : "collapsed"}
      variants={{
        collapsed: { height: "70px" },
        expanded: { height: "60%" }
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* --- Vista "Peek" (Colapsada) --- */}
      <div
        className="flex justify-between items-center p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-semibold text-gray-900">Bandeja de Validación</h3>
        {/* Badge con el número de reportes pendientes */}
        <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">
          {pendingReports.length}
        </span>
      </div>

      {/* --- Vista Expandida --- */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="p-4 overflow-y-auto"
            style={{ height: "calc(100% - 70px)" }} // Restar altura del header
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {isLoading && <p>Cargando reportes...</p>}
            
            {!isLoading && pendingReports.length === 0 && (
              <p className="text-center text-gray-500">No hay reportes pendientes. ¡Buen trabajo!</p>
            )}

            {!isLoading && pendingReports.length > 0 && (
              <div className="space-y-4">
                {pendingReports.map((report) => (
                  <ReportCard 
                    key={report.id}
                    report={report}
                    onApprove={handleApprove}
                    isSubmitting={isSubmitting}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default PanelValidacion; 
