// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const fs = require('fs');
const os = require('os');
const path = require('path');
const pdf = require('pdf-parse');

admin.initializeApp();

exports.enhanceResume = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  try {
    const { fileUrl, fileName } = data;
    const userId = context.auth.uid;
    
    // Get the PDF file path from the URL
    const filePathMatch = fileUrl.match(/o\/(.+)\?/);
    if (!filePathMatch) {
      throw new functions.https.HttpsError(
        'invalid-argument', 
        'Invalid file URL format'
      );
    }
    
    const filePath = decodeURIComponent(filePathMatch[1]);
    const bucket = admin.storage().bucket();
    
    // Download the file to a temporary location
    const tempFilePath = path.join(os.tmpdir(), fileName);
    await bucket.file(filePath).download({ destination: tempFilePath });
    
    // Read the PDF file
    const dataBuffer = fs.readFileSync(tempFilePath);
    let resumeText;
    
    try {
      // Extract text from PDF
      const pdfData = await pdf(dataBuffer);
      resumeText = pdfData.text;
    } catch (pdfError) {
      console.error('Error extracting PDF text:', pdfError);
      // If PDF parsing fails, we'll try using the file URL directly with OpenAI
      resumeText = `The resume can be found at: ${fileUrl}`;
    }
    
    // Call OpenAI API
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional resume enhancer. Analyze the resume and provide specific improvements to make it more attractive to employers."
          },
          {
            role: "user",
            content: `Enhance this resume. ${resumeText}`
          }
        ],
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${functions.config().openai.key}`
        }
      }
    );
    
    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);
    
    // Save the enhanced resume to Firestore
    await admin.firestore().collection('users').doc(userId).update({
      enhancedResume: openaiResponse.data.choices[0].message.content,
      enhancedResumeDate: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Return the enhancement result
    return {
      enhancedResume: openaiResponse.data.choices[0].message.content
    };
    
  } catch (error) {
    console.error('Error in enhanceResume function:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to enhance resume. Please try again.',
      error.message
    );
  }
});