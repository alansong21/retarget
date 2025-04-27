// Using fetch API
const testApi = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/test');
    const data = await response.json();
    console.log('API Response:', data);
    return data;
  } catch (error) {
    console.error('Error testing API:', error);
    throw error;
  }
};

// Using axios (if you prefer axios)
// import axios from 'axios';
// const testApi = async () => {
//   try {
//     const response = await axios.get('http://localhost:5000/api/test');
//     console.log('API Response:', response.data);
//     return response.data;
//   } catch (error) {
//     console.error('Error testing API:', error);
//     throw error;
//   }
// };

export default testApi;
