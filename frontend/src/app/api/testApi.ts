// Define the response type
interface TestApiResponse {
  message: string;
}

// Using fetch API with TypeScript
export const testApi = async (): Promise<TestApiResponse> => {
  try {
    const response = await fetch('http://localhost:5001/api/test');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: TestApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error testing API:', error);
    throw error;
  }
};

// Using axios with TypeScript (alternative implementation)
// import axios from 'axios';
// export const testApi = async (): Promise<TestApiResponse> => {
//   try {
//     const { data } = await axios.get<TestApiResponse>('http://localhost:5000/api/test');
//     return data;
//   } catch (error) {
//     console.error('Error testing API:', error);
//     throw error;
//   }
// };

export default testApi;
