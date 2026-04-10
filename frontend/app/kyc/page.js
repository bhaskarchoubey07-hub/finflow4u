"use client";

import { useState } from "react";
import Header from "../../components/Header";
import { apiRequest } from "../../lib/api";
import { getToken } from "../../lib/auth";

export default function KYCPage() {
  const [status, setStatus] = useState("idle");
  const [docType, setDocType] = useState("PASSPORT");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("submitting");
    
    try {
      // Simulate file upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const token = getToken();
      await apiRequest("/auth/kyc-upload", {
        method: "POST",
        token,
        body: { docType, docUrl: "https://cloud-storage.example.com/kyc/doc_123.pdf" }
      });
      
      setStatus("success");
      setMessage("KYC documents uploaded successfully and are pending review.");
    } catch (error) {
      setMessage(error.message);
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <Header />
      <section className="max-w-3xl mx-auto px-4 py-20">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
           <div className="bg-blue-600 p-8 text-white">
              <h1 className="text-2xl font-bold">Identity Verification (KYC)</h1>
              <p className="text-blue-100 mt-2">Complete your identity verification to enable higher loan limits and express disbursals.</p>
           </div>
           
           <div className="p-8">
              {status === "success" ? (
                <div className="text-center py-10">
                   <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                   </div>
                   <h2 className="text-xl font-bold text-gray-900">Verification in Progress</h2>
                   <p className="text-gray-500 mt-2">{message}</p>
                   <button 
                     onClick={() => window.location.href = '/borrower'}
                     className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                   >
                     Back to Dashboard
                   </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Document Type</label>
                      <select 
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                      >
                         <option value="PASSPORT">Passport</option>
                         <option value="DRIVING_LICENSE">Driving License</option>
                         <option value="ID_CARD">National ID Card</option>
                      </select>
                   </div>

                   <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Upload Document Image</label>
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center hover:border-blue-300 transition-colors bg-gray-50 cursor-pointer">
                         <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                         </svg>
                         <p className="text-sm text-gray-500 font-medium">Click to upload or drag and drop</p>
                         <p className="text-xs text-gray-400 mt-1">PNG, JPG or PDF up to 10MB</p>
                      </div>
                   </div>

                   {message && status === "error" && (
                     <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium">
                        {message}
                     </div>
                   )}

                   <button 
                     type="submit"
                     disabled={status === "submitting"}
                     className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition disabled:opacity-50"
                   >
                     {status === "submitting" ? "Uploading..." : "Submit Verification"}
                   </button>
                </form>
              )}
           </div>
        </div>
      </section>
    </main>
  );
}
