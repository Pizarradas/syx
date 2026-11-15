import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

export default function DeleteProject() {
  const [open, setOpen] = React.useState(false);
  const handleClose = () => setOpen(false);

  return (
    <Card sx={{ maxWidth: 448 }}>
      <CardContent>
        <Typography variant="h6" component="h2">
          Delete project
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          This removes the project and all its files.
        </Typography>
        <form>
          <TextField
            id="email"
            label="Confirm with your email"
            type="email"
            required
            error
            helperText="Enter a valid email address."
            fullWidth
            margin="normal"
          />
          <Button variant="contained" color="error" onClick={() => setOpen(true)}>
            Delete project
          </Button>
        </form>
      </CardContent>
      <Dialog
        open={open}
        onClose={handleClose}
        role="alertdialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
      >
        <DialogTitle id="confirm-title">Delete project?</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-desc">Files and history will be lost.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} autoFocus>
            Cancel
          </Button>
          <Button onClick={handleClose} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
