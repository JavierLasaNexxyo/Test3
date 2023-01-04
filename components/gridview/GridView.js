import { Grid } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useEffect, useState } from 'react'
import useAxios from '../../hooks/useAxios'
import styles from './GridView.module.css'

export default function GridView({
    columns,
    responseFunction,
    pageStateGrid,
    filterGrid,
    dataStateGrid,
    onRowClick,
    axiosConfig
}) {
    const [dataState, setDataState] = useState(dataStateGrid)
    const [pageState, setPageState] = useState(pageStateGrid)

    const [response, isLoading, refetch] = useAxios({axiosConfig})

    useEffect(() => {
        if (response.succedeed) {
            console.log('succedeed en response page')
            setDataState(old => ({
                ...old,
                data: responseFunction(response),
                total: response.data.Total
            }))
            setPageState(old => ({
                ...old,
                isLoading: isLoading
            }))
        } else {
            console.log('Algo ha ocurrido en response page')
        }
    }, [response])

    useEffect(() => {
        setPageState(old => ({
            ...old,
            isLoading: true
        }))
        refetch()
    }, [pageState.page, pageState.pageSize, filterGrid])

    return (
        <Grid container>
            <Grid item xs={12}>
                <DataGrid
                    className={styles.container}
                    autoHeight
                    rows={dataState.data}
                    rowCount={dataState.total}
                    getRowId={row => row.Id}
                    loading={pageState.isLoading}
                    rowsPerPageOptions={pageState.rowsPerPage}
                    pagination
                    page={pageState.page - 1}
                    pageSize={pageState.pageSize}
                    paginationMode='server'
                    sortingMode='server'
                    onRowClick={onRowClick}
                    onPageChange={newPage => {
                        setPageState(old => ({ ...old, page: newPage + 1 }))
                    }}
                    onPageSizeChange={newPageSize =>
                        setPageState(old => ({
                            ...old,
                            pageSize: newPageSize
                        }))
                    }
                    columns={columns}
                />
            </Grid>
        </Grid>
    )
}
