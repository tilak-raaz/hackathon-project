import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage, functions } from '../firebase.config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { v4 as uuidv4 } from 'uuid';
import Navbar from '../components/Navbar';
import { saveUserData } from '../utils/firebaseHelpers';

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [enhancementResult, setEnhancementResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    // Check if file is PDF
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    if (!auth.currentUser) {
      setError('Please log in to upload a resume');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const userId = auth.currentUser.uid;
      const fileId = uuidv4();
      const fileExtension = fileName.split('.').pop();
      const storageRef = ref(storage, `resumes/${userId}/${fileId}.${fileExtension}`);
      
      // Upload the file
      await uploadBytes(storageRef, file);
      setUploadProgress(50);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      setUploadProgress(70);
      
      // Save file reference in Firestore
      await saveUserData(userId, {
        resumeURL: downloadURL,
        resumeFileName: fileName,
        resumeUploadDate: new Date(),
      });
      
      setUploadProgress(100);
      
      // Start AI enhancement process
      enhanceResume(downloadURL, fileName);
      
    } catch (error) {
      console.error("Error uploading file:", error);
      setError('Failed to upload file. Please try again.');
      setIsUploading(false);
    }
  };

  const enhanceResume = async (fileUrl, fileName) => {
    setIsProcessing(true);
    
    try {
      // Call the Cloud Function to initiate the process
      const enhanceResumeFunction = httpsCallable(functions, 'enhanceResume');
      const result = await enhanceResumeFunction({ 
        fileUrl: fileUrl,
        fileName: fileName
      });
      
      // Get the queue ID for status checking
      const queueId = result.data.queueId;
      
      // Start polling for status updates
      startStatusPolling(queueId);
      
    } catch (error) {
      console.error("Error initiating resume enhancement:", error);
      setError('Failed to start resume enhancement. Please try again.');
      setIsProcessing(false);
    }
  };
  
  // Function to poll for status updates
  const startStatusPolling = (queueId) => {
    const checkStatusFunction = httpsCallable(functions, 'checkResumeStatus');
    const pollInterval = 3000; // Check every 3 seconds
    
    const statusChecker = setInterval(async () => {
      try {
        const statusResult = await checkStatusFunction({ queueId });
        const { status, enhancedResume, error } = statusResult.data;
        
        console.log('Current status:', status);
        
        if (status === 'completed' && enhancedResume) {
          // Process is complete
          clearInterval(statusChecker);
          setEnhancementResult(enhancedResume);
          setIsProcessing(false);
        } 
        else if (status === 'error') {
          // Process encountered an error
          clearInterval(statusChecker);
          setError(`Enhancement failed: ${error || 'Unknown error'}`);
          setIsProcessing(false);
        }
        // Continue polling if status is 'pending' or 'processing'
        
      } catch (error) {
        console.error("Error checking status:", error);
        clearInterval(statusChecker);
        setError('Failed to check enhancement status. Please try again.');
        setIsProcessing(false);
      }
    }, pollInterval);
    
    // Store the interval ID for cleanup
    setStatusCheckerId(statusChecker);
  };
  
  // Make sure to clean up interval when component unmounts
  useEffect(() => {
    return () => {
      if (statusCheckerId) {
        clearInterval(statusCheckerId);
      }
    };
  }, [statusCheckerId]);

  // The rest of your component remains the same
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
      {/* Background blur effect with colorful lights */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-purple-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-40 w-72 h-72 bg-blue-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-10 right-20 w-72 h-72 bg-green-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-pulse" style={{animationDelay: '3s'}}></div>
      </div>
      
      {/* Overlay with backdrop filter for better text readability */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/30"></div>
      
      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden">
            <div className="p-8">
              <h1 className="text-3xl font-bold text-white mb-6">Enhance Your Resume with AI</h1>
              <p className="text-gray-200 mb-8">Upload your resume and let our AI analyze and improve it to increase your chances of landing your dream job.</p>
              
              {/* Upload area */}
              <div 
                className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-all ${file ? 'border-green-400 bg-green-400/10' : 'border-gray-400 hover:border-blue-400 bg-white/5 hover:bg-white/10'}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {!file ? (
                  <div>
                    <svg className="mx-auto h-12 w-12 text-gray-300" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-4 text-gray-200">Drag and drop your resume here, or</p>
                    <button 
                      onClick={() => fileInputRef.current.click()}
                      className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium transition-colors"
                    >
                      Browse files
                    </button>
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf"
                    />
                    <p className="mt-2 text-sm text-gray-400">PDF files only, max 5MB</p>
                  </div>
                ) : (
                  <div>
                    <svg className="mx-auto h-12 w-12 text-green-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-4 text-green-200 font-medium">{fileName}</p>
                    <button 
                      onClick={() => {
                        setFile(null);
                        setFileName('');
                      }}
                      className="mt-2 text-sm text-red-300 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-md">
                  <p className="text-red-200">{error}</p>
                </div>
              )}
              
              {isUploading && (
                <div className="mb-6">
                  <p className="text-gray-200 mb-2">Uploading... {uploadProgress}%</p>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {isProcessing && (
                <div className="mb-6">
                  <p className="text-gray-200 mb-2">Enhancing your resume with AI...</p>
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center">
                <button 
                  onClick={handleUpload}
                  disabled={!file || isUploading || isProcessing}
                  className={`px-6 py-3 rounded-md text-white font-medium text-lg transition-colors ${(!file || isUploading || isProcessing) ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'}`}
                >
                  {isUploading || isProcessing ? 'Processing...' : 'Enhance My Resume'}
                </button>
              </div>
              
              {/* Results section */}
              {enhancementResult && (
                <div className="mt-12 bg-white/10 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">AI Enhancement Results</h2>
                  <div className="prose prose-invert max-w-none">
                    <div className="bg-white/5 rounded-md p-6 text-gray-200 whitespace-pre-line">
                      {enhancementResult}
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => {
                        // Copy to clipboard
                        navigator.clipboard.writeText(enhancementResult);
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white font-medium transition-colors"
                    >
                      Copy to Clipboard
                    </button>
                    <button
                      onClick={() => {
                        // Download as text file
                        const element = document.createElement("a");
                        const file = new Blob([enhancementResult], {type: 'text/plain'});
                        element.href = URL.createObjectURL(file);
                        element.download = "enhanced_resume.txt";
                        document.body.appendChild(element);
                        element.click();
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 rounded-md text-white font-medium transition-colors"
                    >
                      Download Enhanced Resume
                    </button>
                  </div>
                </div>
              )}
              
              <div className="mt-8 text-sm text-gray-400 text-center">
                <p>Your resume is processed securely. We don't store the content of your resume permanently.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload;