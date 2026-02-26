import { toast } from "@/components/Toast";

/**
 * Robust PDF Download Utility
 * Downloads PDF with validation (blob size, type, and PDF header)
 *
 * @param {string} quotationId - The quotation ID
 * @param {string} quotationNumber - The quotation number (optional, for logging)
 * @param {string} pdfFilename - The PDF filename (optional, defaults to quotation-{quotationNumber}.pdf)
 * @returns {Promise<void>}
 */
export const downloadQuotationPDF = async (
  quotationId: string,
  quotationNumber: string | null = null,
  pdfFilename: string | null = null
): Promise<void> => {
  try {
    console.log("📄 ===== FRONTEND: PDF DOWNLOAD START =====");
    console.log("📋 Quotation Details:");
    console.log("   - Quotation ID:", quotationId);
    console.log("   - Quotation Number:", quotationNumber);
    console.log("   - PDF Filename:", pdfFilename);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const token = localStorage.getItem("token");

    console.log("🔑 Token check:", token ? "Token found" : "No token");

    if (!token) {
      console.error("❌ No token found in localStorage");
      toast.error("Please login to download PDF");
      return;
    }

    const apiPdfUrl = `${apiBaseUrl}/quotations/${quotationId}/pdf?download=true`;

    console.log("🌐 Request URL:", apiPdfUrl);
    console.log("🚀 Starting fetch request...");
    console.log("📡 Fetch options:", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token?.substring(0, 10)}...`,
      },
    });

    let response: Response;
    try {
      response = await fetch(apiPdfUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("✅ Fetch request completed");
      console.log("📥 Response Status:", response.status);
      console.log("📥 Response OK:", response.ok);
    } catch (fetchError: any) {
      console.error("❌ Fetch error:", fetchError);
      console.error("❌ Fetch error details:", {
        message: fetchError.message,
        name: fetchError.name,
        stack: fetchError.stack,
      });
      toast.error("Network error: " + (fetchError.message || "Failed to connect to server"));
      return;
    }

    console.log("📥 Response Status:", response.status);
    console.log("📥 Response Headers:", {
      "Content-Type": response.headers.get("Content-Type"),
      "Content-Length": response.headers.get("Content-Length"),
      "Content-Disposition": response.headers.get("Content-Disposition"),
    });

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = "Failed to download PDF";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        console.error("❌ PDF download error:", errorData);
      } catch (e) {
        console.error("❌ PDF download error - Status:", response.status, response.statusText);
        errorMessage = `Failed to download PDF: ${response.status} ${response.statusText}`;
      }
      toast.error(errorMessage);
      return;
    }

    // Response is OK, process the PDF
    const blob = await response.blob();

    console.log("📦 Blob Details:");
    console.log("   - Blob Size:", blob.size, "bytes");
    console.log("   - Blob Size (MB):", (blob.size / (1024 * 1024)).toFixed(2), "MB");
    console.log("   - Blob Type:", blob.type);

    // Validate blob
    if (blob.size === 0) {
      console.error("❌ Blob is empty!");
      toast.error("Downloaded PDF is empty. Please try again.");
      return;
    }

    // Check if response is actually an error (JSON error message)
    if (blob.type === "application/json" || blob.type.includes("json")) {
      console.warn("⚠️  Received JSON instead of PDF, likely an error");
      const text = await blob.text();
      console.error("Response text:", text);
      try {
        const errorData = JSON.parse(text);
        toast.error(errorData.message || errorData.error || "Failed to download PDF");
      } catch (e) {
        toast.error("Server returned an error instead of PDF");
      }
      return;
    }

    // Validate PDF type (some servers may return empty type, so we check header too)
    if (blob.type && blob.type !== "application/pdf" && !blob.type.includes("pdf") && !blob.type.includes("octet-stream")) {
      console.warn("⚠️  Blob type is not PDF:", blob.type);
      // Still try to validate PDF header
    }

    // Validate PDF header by reading first bytes
    const arrayBuffer = await blob.slice(0, 4).arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdfHeader = String.fromCharCode(...uint8Array);
    console.log("📄 PDF Header:", pdfHeader);

    if (pdfHeader !== "%PDF") {
      console.error("❌ Invalid PDF header:", pdfHeader);
      // Try to read as text to see if it's an error message
      try {
        const text = await blob.text();
        const errorData = JSON.parse(text);
        toast.error(errorData.message || errorData.error || "Downloaded file is not a valid PDF");
      } catch (e) {
        toast.error("Downloaded file is not a valid PDF. Please try again.");
      }
      return;
    }

    console.log("✅ PDF is valid, creating download...");

    // Get filename from Content-Disposition header or use default
    let filename = pdfFilename || `quotation-${quotationNumber || quotationId}.pdf`;
    const contentDisposition = response.headers.get("Content-Disposition");
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
      }
    }

    console.log("📥 Starting download with filename:", filename);

    // Create download link and trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    link.setAttribute("download", filename);
    
    // Append to body first
    document.body.appendChild(link);
    
    // Use requestAnimationFrame to ensure DOM is ready, then click
    // This ensures the browser has time to process the link before clicking
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          link.click();
          console.log("🖱️ Download link clicked");
          
          // Clean up after download starts (give browser time to initiate download)
          setTimeout(() => {
            try {
              if (document.body.contains(link)) {
                document.body.removeChild(link);
              }
              window.URL.revokeObjectURL(url);
              console.log("🧹 Cleaned up download link");
            } catch (cleanupError) {
              console.warn("⚠️ Error during cleanup:", cleanupError);
            }
          }, 1000);
        } catch (clickError) {
          console.error("❌ Error clicking download link:", clickError);
          toast.error("Failed to trigger download. Please try again.");
          // Clean up on error
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
          window.URL.revokeObjectURL(url);
        }
      });
    });

    console.log("✅ PDF download initiated successfully");
    toast.success("PDF download started");
  } catch (error: any) {
    console.error("❌ Error downloading PDF:", error);
    toast.error("Failed to download PDF: " + (error?.message || "Unknown error"));
  }
};
