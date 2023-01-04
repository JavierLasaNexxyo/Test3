import { Box, Modal } from '@mui/material'

const ModalData = ({ open, onClose, modelToRender, ComponentToRender }) => {
    const styleModal = { overflow: 'scroll' }
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%)',
        width: 'auto',
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4
    }

    return (
        <>
            <Modal
                open={open}
                onClose={onClose}
                aria-labelledby='modal-modal-title'
                aria-describedby='modal-modal-description'
                style={styleModal}
            >
                <Box sx={style}>
                    <ComponentToRender
                        dataState={modelToRender}
                        style={style}
                    />
                </Box>
            </Modal>
        </>
    )
}

export default ModalData
