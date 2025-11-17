import axios from 'axios'
import { API_BASE_URL } from './config.js'

const api = axios.create({
    baseURL : API_BASE_URL,
    withCredentials : true
})

export const addTheatre = async(values)=>{
    try {
       const response = await api.post('/api/theatre/add-theatre' , values)
       return response.data
    } catch (error) {
        console.log(error)
    }
}


