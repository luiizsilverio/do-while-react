import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

interface IAuthProvider {
  children: ReactNode
}

type User = {
  id: string
  name: string
  login: string
  avatar_url: string
}

type AuthContextData = {
  user: User | null
  signInUrl: string
  signOut: () => void
}

type AuthResponse = {
  token: string
  user: {
    id: string
    avatar_url: string
    name: string
    login: string
  }
}

const client_id = '480b7add0725b22a3a82';

export const AuthContext = createContext({} as AuthContextData)

export function AuthProvider(props: IAuthProvider) {
  const [user, setUser] = useState<User | null>(null)
  
  const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=${client_id}`;

  async function signIn(githubCode: string ) {
    const response = await api.post<AuthResponse>('authenticate', {
      code: githubCode
    })

    const { token, user } = response.data;

    localStorage.setItem('@dowhile:token', token)

    api.defaults.headers.common.authorization = `Bearer ${token}`

    setUser(user)
  }

  async function signOut() {
    setUser(null)
    localStorage.removeItem('@dowhile:token')
  }

  useEffect(() => {
    const token = localStorage.getItem('@dowhile:token')

    if (token) {
      // api.defaults.headers.common.authorization = `Bearer ${token}`      
      api.get<User>('profile', {
        headers: { 'Authorization':  `Bearer ${token}` }
      })
      .then(response => {
        setUser(response.data)
      })
    }
  }, [])

  useEffect(() => {
    const url = window.location.href;
    const hasCode = url.includes('?code=')

    if (hasCode) {
      const [urlSemCod, githubCode] = url.split('?code=')

      window.history.pushState({}, '', urlSemCod)

      signIn(githubCode)
    }
  }, [])
    
  return (
    <AuthContext.Provider value={{ signInUrl, user, signOut }}>
      {props.children}
    </AuthContext.Provider>
  )
}