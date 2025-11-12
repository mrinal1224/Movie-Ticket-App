import './App.css'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import {BrowserRouter , Routes , Route} from "react-router-dom"
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'

function App() {
 

  return (
    <>
    <BrowserRouter>
       <Routes>
         <Route path='/home' element={<ProtectedRoute><Home/></ProtectedRoute>}/>
         <Route path='/login' element={<PublicRoute><Login/></PublicRoute>}/>
         <Route path='/register' element={<PublicRoute><Register/></PublicRoute>}/>
       </Routes>
    </BrowserRouter>
     


  
    
    </>
  )
}

export default App
