import React, { useEffect } from 'react'
import { getCurrentUser } from '../calls/authCalls.js'
import { useDispatch , useSelector } from 'react-redux'
import { setUserData } from '../redux/userSlice.js'



function Home() {
  const {userData} = useSelector(state => state.user)
  console.log(userData)
  const dispatch = useDispatch()

  const getUserData = async ()=>{
     const userData =  await getCurrentUser()
     
     dispatch(setUserData(userData))
     


     if (!userData) {
       console.log('No user data - user may not be logged in or session expired')
     }
  }

   useEffect(()=>{
     getUserData()
   } , [])

  

  return (
    <div>
        <h1>{userData?.name}</h1>
        <h1>{userData?.email}</h1>
      
    </div>
  )
}

export default Home