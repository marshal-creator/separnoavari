// Utility functions for file downloads

export function buildFileUrl(path: string): string {
  // Simple implementation - adjust based on your API structure
  if (path.startsWith('http')) {
    return path;
  }
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Downloads a file from a URL with proper binary data handling to prevent corruption
 * @param url - The file URL (relative or absolute)
 * @param filename - The desired filename for the download
 * @param defaultContentType - Optional default MIME type if not provided by server
 */
export async function downloadFile(url: string, filename: string, defaultContentType?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const absoluteUrl = url?.startsWith('http') 
        ? url 
        : `${window.location.origin}${url}`;
      
      // Use XMLHttpRequest for better binary data handling
      const xhr = new XMLHttpRequest();
      xhr.open('GET', absoluteUrl, true);
      xhr.responseType = 'arraybuffer'; // Critical: get binary data as arraybuffer
      xhr.withCredentials = true;
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const arrayBuffer = xhr.response;
            
            // Verify we got actual data
            if (!arrayBuffer || arrayBuffer.byteLength === 0) {
              throw new Error('Downloaded file is empty');
            }
            
            // Get content type from response or use default
            let contentType = xhr.getResponseHeader('content-type');
            if (!contentType || contentType.includes('text/html') || contentType.includes('text/plain')) {
              if (defaultContentType) {
                contentType = defaultContentType;
              } else {
                const lowerFilename = filename.toLowerCase();
                if (lowerFilename.endsWith('.pdf')) {
                  contentType = 'application/pdf';
                } else if (lowerFilename.endsWith('.doc')) {
                  contentType = 'application/msword';
                } else if (lowerFilename.endsWith('.docx')) {
                  contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                } else {
                  contentType = 'application/octet-stream';
                }
              }
            }
            
            // Create blob directly from arrayBuffer with correct MIME type
            const blob = new Blob([arrayBuffer], { type: contentType });
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Create a temporary anchor element to trigger download
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            
            // Wait before cleanup to ensure download starts
            setTimeout(() => {
              document.body.removeChild(link);
              window.URL.revokeObjectURL(blobUrl);
              resolve();
            }, 500);
          } catch (error) {
            console.error('Download processing error:', error);
            // Fallback to opening in new tab
            window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
            reject(error);
          }
        } else {
          throw new Error(`Failed to download file: ${xhr.status} ${xhr.statusText}`);
        }
      };
      
      xhr.onerror = function() {
        console.error('Download network error');
        // Fallback to opening in new tab
        window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
        reject(new Error('Network error during download'));
      };
      
      xhr.send();
    } catch (error) {
      console.error('Download error:', error);
      const absoluteUrl = url?.startsWith('http') 
        ? url 
        : `${window.location.origin}${url}`;
      window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
      reject(error);
    }
  });
}
