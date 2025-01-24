import { REACT_APP_BACKEND_URL, REACT_APP_CLOUDINARY_CLOUD_NAME } from "../utils/constant"

const url = `https://api.cloudinary.com/v1_1/${REACT_APP_CLOUDINARY_CLOUD_NAME}/auto/upload`

const uploadFile = async(file)=>{
    const formData = new FormData()
    formData.append('file',file)
    formData.append("upload_preset","chat-app-file")

    const response = await fetch(url,{
        method : 'post',
        body : formData
    })
    const responseData = await response.json()


    return responseData
}

export default uploadFile

// const url = `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/auto/upload`;
// const uploadFile = async (file) => {
//     try {
       

//         const formData = new FormData();
//         formData.append('file', file);
//         formData.append('upload_preset', 'chat-app-file');

//         const response = await fetch(url, {
//             method: 'POST',
//             body: formData,
//         });

//         if (!response.ok) {
//             throw new Error(`Failed to upload file: ${response.statusText}`);
//         }

//         const responseData = await response.json();
//         console.log('Cloudinary Response:', responseData); // Debug response

//         return responseData;
//     } catch (error) {
//         console.error('File upload error:', error);
//         return null;
//     }
// };
