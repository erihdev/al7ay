-- Add RLS policies for service providers to upload their logos and certificates

-- Allow service providers to upload to product-images bucket (for their logos, certificates, and products)
CREATE POLICY "Service providers can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND (
    -- Check if user is a service provider
    EXISTS (
      SELECT 1 FROM public.service_providers sp 
      WHERE sp.user_id = auth.uid()
    )
  )
);

-- Allow service providers to update their own images
CREATE POLICY "Service providers can update their images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' 
  AND (
    EXISTS (
      SELECT 1 FROM public.service_providers sp 
      WHERE sp.user_id = auth.uid()
    )
  )
);

-- Allow service providers to delete their own images
CREATE POLICY "Service providers can delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' 
  AND (
    EXISTS (
      SELECT 1 FROM public.service_providers sp 
      WHERE sp.user_id = auth.uid()
    )
  )
);