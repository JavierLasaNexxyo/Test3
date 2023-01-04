import Cookies from 'js-cookie'

const accessTokenKey = 'accessToken'
const expirationDateKey = 'expirationDate'

const getStorage = () =>
    Cookies.get('remember_me') === 'True' ? localStorage : sessionStorage

export const getAccessToken = () => getStorage().getItem(accessTokenKey)

export const saveTokens = authentication => {
    const storage = getStorage()

    storage.setItem(accessTokenKey, authentication.AccessToken)
    storage.setItem(expirationDateKey, authentication.ExpirationDate.toString())
}

export const isTokenExpired = () => {
    const expirationDate = getStorage().getItem(expirationDateKey)

    if (!expirationDate) {
        return false
    }

    const expDate = new Date(expirationDate)

    const now = new Date()

    return (
        expDate.getTime() - process.env.REACT_APP_API_TIMEOUT_REFRESH <=
        now.getTime()
    )
}

export const isLogged = () => {
    const storage = getStorage()

    const token = storage.getItem(accessTokenKey)
    const expirationDate = storage.getItem(expirationDateKey)

    if (token && expirationDate) {
        return true
    } else {
        logout()
        return false
    }
}

export const getClaims = () => {
    if (!isLogged()) {
        return {}
    }

    const token = getStorage().getItem(accessTokenKey)

    return JSON.parse(window.atob(token.split('.')[1]))
}

export const logout = () => {
    const storage = getStorage()

    storage.removeItem(accessTokenKey)
    storage.removeItem(expirationDateKey)
}
