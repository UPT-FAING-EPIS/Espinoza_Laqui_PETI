import { ArrowRight, CircleAlert, FileText, Network } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getActivePetiGroupId } from '../session'
import '../App.css'
import './PlanGatewayPage.css'

export default function PlanGatewayPage() {
  const { user } = useAuth()
  const activeGroupId = getActivePetiGroupId()

  if (activeGroupId) {
    return <Navigate to={`/groups/${activeGroupId}/plan`} replace />
  }

  if (!user) return null

  const groupsPath = user.role === 'ADMINISTRADOR' ? '/admin/groups' : '/my-groups'
  const groupsLabel = user.role === 'ADMINISTRADOR' ? 'Gestionar grupos' : 'Ver mis grupos'

  return (
    <div className="plan-gateway">
      <header className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <span>PETI</span>
            <span>/</span>
            <span>Plan de grupo</span>
          </div>
          <h1>Plan PETI</h1>
          <p className="page-subtitle">Selecciona un grupo para consultar o editar su plan estrategico de TI.</p>
        </div>
      </header>

      <section className="plan-gateway-card">
        <div className="plan-gateway-icon">
          <FileText size={34} />
        </div>
        <div className="plan-gateway-content">
          <div className="plan-gateway-kicker">
            <CircleAlert size={15} />
            <span>Sin plan seleccionado</span>
          </div>
          <h2>Primero elige un grupo</h2>
          <p>
            El plan PETI se abre desde un grupo asignado. Al ingresar a uno, esta seccion recordara ese plan durante la sesion.
          </p>
        </div>
        <Link className="btn btn-primary plan-gateway-action" to={groupsPath}>
          <Network size={16} />
          {groupsLabel}
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  )
}
