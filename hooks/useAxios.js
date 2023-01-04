import axios from 'axios'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import {
    getAccessToken,
    isLogged,
    isTokenExpired,
    logout,
    saveTokens
} from '../utils/authenticationManager'

const useAxios = axiosParams => {
    const [response, setResponse] = useState({})
    const [loading, setLoading] = useState(false)
    const [reload, setReload] = useState(0)

    const reFetch = () => setReload(prev => prev + 1)

    const setHeaders = headers => {
        const token = getAccessToken()
        if (token) {
            headers.Authorization = `bearer ${token}`
        }

        const language = localStorage.getItem('i18nextLng')
        if (language) {
            headers.Language = language
        }
    }

    const logoutApp = async () => {
        logout()

        const controller = new AbortController()

        const headers = {
            signal: controller.signal
        }
        setHeaders(headers)

        await axios({
            method: 'post',
            url: axiosParams.endPoints.authLogout,
            headers,
            withCredentials: true,
            timeout: process.env.REACT_APP_API_TIMEOUT_REFRESH
        }).catch(err => {
            if (err.code === 'ECONNABORTED') {
                controller.abort()
            }
        })

        window.location = window.location.origin
    }

    const refreshToken = async () => {
        if (isLogged()) {
            if (isTokenExpired()) {
                const controller = new AbortController()

                const headers = {
                    signal: controller.signal
                }
                setHeaders(headers)

                const refreshOk = await axios
                    .get(axiosParams.endPoints.authRefresh, {
                        headers,
                        withCredentials: true,
                        timeout: process.env.REACT_APP_API_TIMEOUT_REFRESH
                    })
                    .then(response => {
                        if (response.status === 200) {
                            if (response.data.Succeeded) {
                                saveTokens(response.data.Data)
                                return true
                            } else {
                                return false
                            }
                        }
                    })
                    .catch(err => {
                        if (err.code === 'ECONNABORTED') {
                            controller.abort()
                        }
                        return false
                    })

                if (refreshOk) {
                    return true
                } else {
                    await logoutApp()
                    return false
                }
            } else {
                return true
            }
        } else {
            // The user is not logged, so no need to refresh the token
            return true
        }
    }

    const formatGetUrlWithParams = config => {
        // Iterate get data to add it to the URL
        if (config.method === 'get' && config.data) {
            const keys = Object.keys(config.data)
            if (keys) {
                config.url += '?'
                keys.map(key => {
                    config.url += `${key}=${config.data[key]}&`
                })
                config.url = config.url.slice(0, -1)
                delete config.data
            }
        }
    }

    useEffect(() => {
        const fetchData = async params => {
            setLoading(true)
            try {
                let result

                const refreshOk = await refreshToken()
                if (!refreshOk) {
                    result = { succedeed: false }
                } else {
                    const controller = new AbortController()

                    params.axiosConfig.config.headers = {
                        signal: controller.signal
                    }

                    setHeaders(params.axiosConfig.config.headers)

                    params.axiosConfig.config.withCredentials = true
                    params.axiosConfig.config.timeout = process.env.REACT_APP_API_TIMEOUT

                    formatGetUrlWithParams(params.axiosConfig.config)

                    result = await axios(params.axiosConfig.config)
                        .then(response => {
                            if (response.status === 200) {
                                if (!response.data.Succeeded) {
                                    let body = ''
                                    response.data.Errors.map(error => {
                                        body += `<p>${error.Description}</p>`
                                    })
                                    return {
                                        succedeed: false,
                                        error: {
                                            title: params.axiosConfig.resources.error,
                                            message: body
                                        }
                                    }
                                } else {
                                    return {
                                        succedeed: true,
                                        data: response.data.Data
                                    }
                                }
                            }
                        })
                        .catch(err => {
                            if (err.response) {
                                if (err.response.status === 401) {
                                    return {
                                        succedeed: false,
                                        error: {
                                            title: params.axiosConfig.resources.unauthorised,
                                            message: params.axiosConfig.resources.noHaveAccess
                                        }
                                    }
                                } else if (err.response.status === 500) {
                                    let result = {
                                        succedeed: false,
                                        error: { title: params.axiosConfig.resources.error}
                                    }
                                    if (err.response.data?.Errors?.length) {
                                        result.error.message =
                                            err.response.data.Errors[0].Description
                                    } else {
                                        result.error.message =
                                            'Internal server error.'
                                    }
                                    return result
                                } else if (err.response.status === 400) {
                                    let output = ''
                                    const errors = err.response.data?.Errors
                                    if (errors) {
                                        output += '<ul>'
                                        errors.forEach(error => {
                                            output += `<li style="text-align: justify;">${error.Description}</li>`
                                        })
                                        output += '</ul>'
                                    }
                                    return {
                                        succedeed: false,
                                        error: {
                                            title: params.resources.badRequest,
                                            message: output
                                                ? output
                                                : params.resources.uncontrolledError
                                        }
                                    }
                                } else if (err.response.status === 0) {
                                    return {
                                        succedeed: false,
                                        error: {
                                            title: params.resources.error,
                                            message: params.resources.connectionError
                                        }
                                    }
                                }
                            } else {
                                if (err.code === 'ERR_NETWORK') {
                                    // Connection error
                                    return {
                                        succedeed: false,
                                        error: {
                                            title: params.resources.error,
                                            message: params.resources.connectionError
                                        }
                                    }
                                } else if (err.code === 'ECONNABORTED') {
                                    // Time out
                                    controller.abort()
                                    return {
                                        succedeed: false,
                                        error: {
                                            title: params.resources.timeout,
                                            message: params.resources.timeoutMessage
                                        }
                                    }
                                }
                            }
                        })
                }

                if (!result.succedeed) {
                    //error(result.error.title, result.error.message)
                    Swal.fire({
                        position: 'center',
                        icon: 'error',
                        title: result.error.title,
                        html: result.error.message,
                        showConfirmButton: true,
                        showCloseButton: true
                    })
                }

                setResponse(result)
            } finally {
                setLoading(false)
            }
        }

        if (axiosParams.onLoad || reload > 0) {
            fetchData(axiosParams)
        }

        // eslint-disable-next-line
    }, [reload])

    return [response, loading, reFetch]
}

export default useAxios
