import { createReducer, on } from '@ngrx/store';
import { ISesion } from 'src/app/auth/interfaces/sesion';
import * as SesionActions from '../actions/sesion.actions';
const initialState: ISesion = {
  active: false,
};

export const SesionReducer = createReducer(
  initialState,
  on(SesionActions.LoadSesion, (s) => {
    return { ...s, active: false };
  }),
  on(SesionActions.SesionLoaded, (s, { sesion }) => {
    return { ...s, active: sesion.active, identity: sesion.identity };
  }),
  on(SesionActions.CloseSesion, (s) => {
    return { ...s, active: false };
  }),
  on(SesionActions.ErrorSesion, (s, e) => {
    console.error(e.error);
    return { ...s, active: false };
  })
);
