import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary utilizando las variables de entorno heredadas de ABDAgRAG
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sube un recurso visual de marca blanca (logotipo o favicon) a Cloudinary
 * con transformaciones de tamaño y optimización automáticas.
 */
export async function uploadBrandingAsset(
  buffer: Buffer,
  filename: string,
  tenantId: string,
  assetType: 'logo' | 'favicon'
): Promise<{ url: string; publicId: string; secureUrl: string }> {
  return new Promise((resolve, reject) => {
    const folder = `abd-tenant-governance/tenants/${tenantId}/branding`;
    const publicId = `${assetType}_${Date.now()}`;
    
    // Aplicar transformaciones optimizadas según el tipo de asset (marca blanca premium)
    const transformation = assetType === 'logo'
      ? [{ width: 800, height: 400, crop: 'limit' }, { quality: 'auto', fetch_format: 'auto' }]
      : [{ width: 64, height: 64, crop: 'fill' }, { quality: 'auto', fetch_format: 'auto' }];

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder,
        public_id: publicId,
        transformation,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.url,
            publicId: result.public_id,
            secureUrl: result.secure_url,
          });
        } else {
          reject(new Error('Fallo en la subida a Cloudinary sin error de respuesta'));
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Elimina un recurso visual del CDN de Cloudinary para mantener el almacenamiento limpio
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (err) {
    console.error(`[CLOUDINARY_DELETE_ERROR] Failed to destroy asset ${publicId}:`, err);
  }
}
