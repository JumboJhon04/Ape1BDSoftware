import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Building2, ImageOff, MapPin, Tag } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import ModulePageShell from '@/shared/components/ModulePageShell'
import {
  getArticuloImages,
  getCategorias,
  getDepartamentos,
  getInventoryCatalog,
  getMovimientoHistorial,
  getUbicaciones,
  linkArticuloImage,
} from '@/features/inventory/services/inventory.service'
import { API_BASE_URL } from '@/core/config/env'
import { uploadImageToCloudinary } from '@/features/inventory/services/cloudinary.service'

function resolveImageUrl(urlImagen) {
  if (!urlImagen) return ''
  if (/^(https?:|data:|blob:)/i.test(urlImagen)) return urlImagen

  const origin = API_BASE_URL.replace(/\/api\/?$/, '')
  const normalizedPath = urlImagen.startsWith('/') ? urlImagen : `/${urlImagen}`
  return `${origin}${normalizedPath}`
}

function InventoryDetailPage() {
  const navigate = useNavigate()
  const { idArticulo } = useParams()
  const articuloId = Number(idArticulo)

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [articulo, setArticulo] = useState(null)
  const [imagenes, setImagenes] = useState([])
  const [categorias, setCategorias] = useState([])
  const [ubicaciones, setUbicaciones] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadDetail = async () => {
      if (!Number.isFinite(articuloId)) {
        setErrorMessage('El identificador del artículo no es válido.')
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      try {
        const [catalogo, imagenesRes, categoriasRes, ubicacionesRes, departamentosRes, movimientosRes] =
          await Promise.all([
            getInventoryCatalog(),
            getArticuloImages(articuloId),
            getCategorias(),
            getUbicaciones(),
            getDepartamentos(),
            getMovimientoHistorial(),
          ])

        if (!isMounted) return

        const selectedArticulo = catalogo.find((item) => item.idArticulo === articuloId) ?? null

        if (!selectedArticulo) {
          setErrorMessage('No se encontró el artículo solicitado.')
          return
        }

        setArticulo(selectedArticulo)
        setImagenes(imagenesRes)
        setCategorias(categoriasRes)
        setUbicaciones(ubicacionesRes)
        setDepartamentos(departamentosRes)
        setMovimientos(movimientosRes)
      } catch (error) {
        if (!isMounted) return

        setErrorMessage(
          error.response?.data?.message ?? 'No se pudo cargar el detalle del artículo.',
        )
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadDetail()

    return () => {
      isMounted = false
    }
  }, [articuloId])

  const categoriaNombre = useMemo(() => {
    return categorias.find((item) => item.idCategoria === articulo?.idCategoria)?.nombre ?? articulo?.categoria ?? '-'
  }, [articulo, categorias])

  const ubicacionNombre = useMemo(() => {
    return ubicaciones.find((item) => item.idUbicacion === articulo?.idUbicacion)?.nombreEspacio ?? articulo?.ubicacion ?? '-'
  }, [articulo, ubicaciones])

  const departamentoNombre = useMemo(() => {
    const ubicacion = ubicaciones.find((item) => item.idUbicacion === articulo?.idUbicacion)
    return departamentos.find((item) => item.idDepartamento === ubicacion?.idDepartamento)?.nombreDepartamento ?? '-'
  }, [articulo, ubicaciones, departamentos])

  const historialArticulo = useMemo(() => {
    return movimientos.filter((item) => (item.idArticulo ?? item.IdArticulo) === articuloId)
  }, [movimientos, articuloId])

  const selectedImageUrl = resolveImageUrl(imagenes[0]?.urlImagen ?? imagenes[0]?.UrlImagen ?? '')

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setUploadError('')
    setUploadSuccess('')

    if (!file) {
      setSelectedFile(null)
      return
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('Solo puedes subir archivos de imagen.')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  const handleUploadImage = async () => {
    if (!selectedFile) {
      setUploadError('Selecciona una imagen primero.')
      return
    }

    setUploadingImage(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      const { secureUrl } = await uploadImageToCloudinary(selectedFile)
      await linkArticuloImage(articuloId, secureUrl)

      const refreshedImages = await getArticuloImages(articuloId)
      setImagenes(refreshedImages)
      setSelectedFile(null)
      setUploadSuccess('Imagen subida y vinculada correctamente.')
    } catch (error) {
      setUploadError(error?.message ?? 'No se pudo subir la imagen.')
    } finally {
      setUploadingImage(false)
    }
  }

  return (
    <ModulePageShell
      title={articulo ? `Detalle del Artículo: ${articulo.nombre}` : 'Detalle del Artículo'}
      description="Vista independiente del artículo con su imagen, ubicación, categorías y trazabilidad."
    >
      <div className="inventory-detail-topbar">
        <button className="inventory-back-button" type="button" onClick={() => navigate('/inventario')}>
          <ArrowLeft size={16} aria-hidden="true" />
          Volver al inventario
        </button>
      </div>

      {errorMessage ? <p className="feedback-error">{errorMessage}</p> : null}

      {loading ? (
        <p className="users-empty">Cargando detalle del artículo...</p>
      ) : articulo ? (
        <div className="inventory-detail-layout">
          <section className="inventory-detail-card-panel">
            <div className="inventory-detail-image-box">
              {selectedImageUrl ? (
                <img src={selectedImageUrl} alt={articulo.nombre} className="inventory-detail-image" />
              ) : (
                <div className="inventory-detail-image-placeholder">
                  <ImageOff size={34} aria-hidden="true" />
                  <span>Sin imagen disponible</span>
                </div>
              )}
            </div>

            <div className="inventory-detail-heading-block">
              <h2>{articulo.nombre}</h2>
              <p>{articulo.descripcionTecnica || 'No hay descripción técnica registrada.'}</p>
            </div>

            <div className="inventory-upload-panel">
              <label className="inventory-upload-label" htmlFor="inventory-image-file">
                Subir imagen del artículo
              </label>
              <input
                id="inventory-image-file"
                className="inventory-upload-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploadingImage}
              />
              <div className="inventory-upload-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUploadImage}
                  disabled={uploadingImage || !selectedFile}
                >
                  {uploadingImage ? 'Subiendo...' : 'Subir a Cloudinary'}
                </button>
                {selectedFile ? <span>{selectedFile.name}</span> : null}
              </div>
              {uploadError ? <p className="feedback-error">{uploadError}</p> : null}
              {uploadSuccess ? <p className="feedback-success">{uploadSuccess}</p> : null}
            </div>

            <div className="inventory-detail-chip-row">
              <span className="inventory-detail-chip inventory-detail-chip-blue">
                <Tag size={14} aria-hidden="true" />
                {categoriaNombre}
              </span>
              <span className="inventory-detail-chip inventory-detail-chip-green">
                <MapPin size={14} aria-hidden="true" />
                {ubicacionNombre}
              </span>
              <span className="inventory-detail-chip inventory-detail-chip-slate">
                <Building2 size={14} aria-hidden="true" />
                {departamentoNombre}
              </span>
            </div>

            <dl className="inventory-detail-meta-list">
              <div>
                <dt>Estado</dt>
                <dd>{articulo.estado || '-'}</dd>
              </div>
              <div>
                <dt>Responsable</dt>
                <dd>{articulo.responsable || '-'}</dd>
              </div>
              <div>
                <dt>Código Institucional</dt>
                <dd>{articulo.codigoInstitucional || '-'}</dd>
              </div>
              <div>
                <dt>Número de Serie</dt>
                <dd>{articulo.numeroSerie || '-'}</dd>
              </div>
              <div>
                <dt>Marca</dt>
                <dd>{articulo.marca || '-'}</dd>
              </div>
              <div>
                <dt>Modelo</dt>
                <dd>{articulo.modelo || '-'}</dd>
              </div>
            </dl>
          </section>

          <section className="inventory-detail-side">
            <div className="inventory-detail-panel">
              <div className="inventory-detail-panel-header">
                <h3>Ubicación y catálogo</h3>
                <span>Datos consultados desde las APIs</span>
              </div>

              <dl className="inventory-detail-rows">
                <div>
                  <dt>Categoría</dt>
                  <dd>{categoriaNombre}</dd>
                </div>
                <div>
                  <dt>Ubicación</dt>
                  <dd>{ubicacionNombre}</dd>
                </div>
                <div>
                  <dt>Departamento</dt>
                  <dd>{departamentoNombre}</dd>
                </div>
                <div>
                  <dt>Responsable</dt>
                  <dd>{articulo.responsable || '-'}</dd>
                </div>
              </dl>
            </div>

            <div className="inventory-detail-panel">
              <div className="inventory-detail-panel-header">
                <h3>Historial del Artículo</h3>
                <span>{historialArticulo.length} movimientos</span>
              </div>

              {historialArticulo.length > 0 ? (
                <div className="inventory-history-table">
                  <div className="inventory-history-head">
                    <span>Fecha</span>
                    <span>Evento</span>
                    <span>Detalle</span>
                  </div>
                  {historialArticulo.map((movimiento) => (
                    <div className="inventory-history-row" key={movimiento.id ?? `${movimiento.fecha}-${movimiento.motivo}`}>
                      <span>{new Date(movimiento.fecha).toLocaleDateString('es-ES')}</span>
                      <span>Movimiento</span>
                      <span>
                        {movimiento.de} → {movimiento.a}. {movimiento.motivo}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="inventory-empty-note">
                  No hay historial de movimientos registrado para este artículo.
                </p>
              )}
            </div>

            <div className="inventory-detail-panel">
              <div className="inventory-detail-panel-header">
                <h3>Trazabilidad</h3>
                <span>Resumen técnico</span>
              </div>

              <ul className="inventory-trace-list inventory-trace-list-detail">
                <li>
                  <strong>Descripción:</strong> {articulo.descripcionTecnica || '-'}
                </li>
                <li>
                  <strong>Ubicación actual:</strong> {ubicacionNombre}
                </li>
                <li>
                  <strong>Departamento:</strong> {departamentoNombre}
                </li>
                <li>
                  <strong>Imagen vinculada:</strong> {selectedImageUrl ? 'Sí' : 'No'}
                </li>
              </ul>
            </div>
          </section>
        </div>
      ) : null}
    </ModulePageShell>
  )
}

export default InventoryDetailPage