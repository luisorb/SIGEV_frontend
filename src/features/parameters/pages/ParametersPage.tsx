import { Settings } from 'lucide-react'
import { useParameters } from '../hooks/useParameters'
import { ParameterForm } from '../components/ParameterForm'
import { ParameterHistoryTable } from '../components/ParameterHistoryTable'

export function ParametersPage() {
  const {
    editParams,
    updateParam,
    versions,
    activeVersion,
    isDirty,
    nextVersion,
    aprobadoPor,
    setAprobadoPor,
    saveNewVersion,
    loadVersion,
    discardChanges,
    saveMessage,
  } = useParameters()

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-slate-400" />
          <h1 className="text-2xl font-bold text-slate-900">Parámetros del Sistema</h1>
        </div>
        <p className="text-sm text-slate-500">
          Gestión de tasas y parámetros de cálculo. Los cambios se versionan automáticamente y quedan registrados en auditoría.
        </p>
      </div>

      <ParameterForm
        editParams={editParams}
        activeVersion={activeVersion ? { version: activeVersion.version } : null}
        isDirty={isDirty}
        nextVersion={nextVersion}
        aprobadoPor={aprobadoPor}
        saveMessage={saveMessage}
        onUpdateParam={updateParam}
        onAprobadoPorChange={setAprobadoPor}
        onSave={saveNewVersion}
        onDiscard={discardChanges}
      />

      <ParameterHistoryTable
        versions={versions}
        activeVersionId={activeVersion?.id ?? null}
        onLoadVersion={loadVersion}
      />
    </div>
  )
}
