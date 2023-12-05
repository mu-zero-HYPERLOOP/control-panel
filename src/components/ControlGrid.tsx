import ControlTable from '../components/PodTemperatures';
import { Grid, Paper, Box, Skeleton, styled } from '@mui/material';

const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  }));


function ControlGrid({ isConnecting=true }) {
    return (
        <Grid container rowSpacing={1} columnSpacing={{ xs: 1, md: 2 }} sx={{ margin: "1%" }}>
            {isConnecting ? (
                <>
                    {Array.from({ length: 4 }, (_, index) => (
                        <Grid item xs={6} md={(index % 4 === 0 || index % 4 === 3) ? 8 : 4} key={index}>
                            <Skeleton variant="rounded" width="100%" height="300px" />
                        </Grid>
                    ))}
                </>
            ) : (
                <>
                    <Grid item xs={6} md={8}>
                        <Item sx={{ width: "100%", height: "300px" }}>
                            xs=6 md=8
                        </Item>
                    </Grid>
                    <Grid item xs={6} md={4}>
                        <Item sx={{ width: "100%", height: "300px" }}>
                            xs=6 md=8
                        </Item>
                    </Grid>
                    <Grid item xs={6} md={4}>
                        <Item sx={{ width: "100%", height: "300px" }}>
                            xs=6 md=8
                        </Item>
                    </Grid>
                    <Grid item xs={6} md={8}>
                        <Item sx={{ width: "100%", height: "300px" }}>
                            xs=6 md=8
                        </Item>
                    </Grid>
                    <Grid item xs={6} md={4}>
                        <Item sx={{ width: "100%", height: "300px" }}>
                            xs=6 md=8
                        </Item>
                    </Grid>
                    <Grid item xs={12} md={12}>
                        <Item sx={{ width: "100%", height: "300px" }}>
                            xs=6 md=8
                        </Item>
                    </Grid>
                </>
            )}
        </Grid>
    );
}

export default ControlGrid;