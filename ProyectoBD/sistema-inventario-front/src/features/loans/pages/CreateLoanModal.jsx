import { X, Plus, User, Calendar, Package } from 'lucide-react'

function CreateLoanModal({
  showCreateModal,
  createSubmitting,
  createError,
  users,
  availableArticles,
  createForm,
  setCreateForm,
  onClose,
  onSubmit,
}) {
  if (!showCreateModal) return null

  const toggleArticle = (id) => {
    setCreateForm((prev) => {
      const already = prev.articulosIds.includes(id)
      return {
        ...prev,
        articulosIds: already
          ? prev.articulosIds.filter((a) => a !== id)
          : [...prev.articulosIds, id],
      }
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setCreateForm((prev) => ({ ...prev, [name]: value }))
  }

  const selectedCount = createForm.articulosIds.length

  return (
    <div
      className="modal-backdrop"
      style={{ position: 'fixed', inset: 0, zIndex: 25 }}
      role="presentation"
      onClick={() => !createSubmitting && onClose()}
    >
      <section
        className="modal-card"
        style={{
          maxWidth: '520px',
          position: 'relative',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '16px',
        }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header
          style={{
            background: '#c0392b',
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={18} color="white" />
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: '600', fontSize: '15px', margin: 0, lineHeight: 1.2 }}>
                Nueva solicitud
              </p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: 0 }}>
                Registro administrativo de préstamo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={createSubmitting}
            style={{
              width: '30px',
              height: '30px',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
            }}
          >
            <X size={14} />
          </button>
        </header>

        {/* Body */}
        <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Solicitante */}
          <div>
            <label
              style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#64748b',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '7px',
              }}
            >
              Solicitante
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  pointerEvents: 'none',
                }}
              />
              <select
                name="idUsuario"
                value={createForm.idUsuario}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  color: '#1e293b',
                  appearance: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">Seleccionar usuario...</option>
                {users.map((u) => (
                  <option key={u.idUsuario} value={u.idUsuario}>
                    {u.nombre}
                  </option>
                ))}
              </select>
              <div
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#94a3b8',
                }}
              >
                ▾
              </div>
            </div>
          </div>

          {/* Fecha prevista */}
          <div>
            <label
              style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#64748b',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '7px',
              }}
            >
              Fecha prevista de devolución
            </label>
            <div style={{ position: 'relative' }}>
              <Calendar
                size={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="date"
                name="fechaPrevista"
                value={createForm.fechaPrevista}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  color: '#1e293b',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Artículos */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '7px',
              }}
            >
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#64748b',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Artículos disponibles
              </label>
              <span
                style={{
                  fontSize: '11px',
                  color: selectedCount > 0 ? '#c0392b' : '#94a3b8',
                  background: selectedCount > 0 ? '#fef2f2' : '#f1f5f9',
                  padding: '2px 10px',
                  borderRadius: '20px',
                  border: `1px solid ${selectedCount > 0 ? '#fecaca' : '#e2e8f0'}`,
                  fontWeight: selectedCount > 0 ? '600' : '400',
                  transition: 'all 0.2s',
                }}
              >
                {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
              </span>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                overflow: 'hidden',
                maxHeight: '220px',
                overflowY: 'auto',
              }}
            >
              {availableArticles.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '13px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Package size={24} color="#cbd5e1" />
                  No hay artículos disponibles
                </div>
              ) : (
                availableArticles.map((item, idx) => {
                  const isSelected = createForm.articulosIds.includes(item.idArticulo)
                  const isLast = idx === availableArticles.length - 1
                  return (
                    <div
                      key={item.idArticulo}
                      onClick={() => toggleArticle(item.idArticulo)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                        background: isSelected ? 'rgba(192,57,43,0.05)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* Checkbox visual */}
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '5px',
                          border: isSelected ? '2px solid #c0392b' : '1.5px solid #cbd5e1',
                          background: isSelected ? '#c0392b' : 'white',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                      >
                        {isSelected && (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '13px',
                            fontWeight: isSelected ? '600' : '500',
                            color: '#1e293b',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.nombre}
                        </p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                          #{String(item.idArticulo).padStart(3, '0')} · Disponible
                        </p>
                      </div>

                      {/* Badge seleccionado */}
                      {isSelected && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            color: '#c0392b',
                            background: '#fef2f2',
                            padding: '2px 8px',
                            borderRadius: '20px',
                            border: '1px solid #fecaca',
                            flexShrink: 0,
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Error */}
          {createError && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '13px',
              }}
            >
              {createError}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer
          style={{
            padding: '14px 22px',
            borderTop: '1px solid #f1f5f9',
            background: '#f8fafc',
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={createSubmitting}
            style={{
              padding: '9px 20px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: 'white',
              color: '#64748b',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={createSubmitting}
            style={{
              padding: '9px 20px',
              borderRadius: '10px',
              border: 'none',
              background: createSubmitting ? '#e2e8f0' : '#c0392b',
              color: createSubmitting ? '#94a3b8' : 'white',
              fontSize: '13px',
              fontWeight: '600',
              cursor: createSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              transition: 'background 0.2s',
            }}
          >
            {!createSubmitting && <Plus size={14} />}
            {createSubmitting ? 'Creando...' : 'Crear préstamo'}
          </button>
        </footer>
      </section>
    </div>
  )
}

export default CreateLoanModal
