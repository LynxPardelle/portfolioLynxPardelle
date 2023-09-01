import { ActionReducerMap } from '@ngrx/store';

/* Interfaces */
import { ISesion } from 'src/app/auth/interfaces/sesion';
// import { Token } from '../auth/interfaces/token';
import MainState from '../core/interfaces/main.state';

/* Reducers */
import { MainReducer } from './reducers/main.reducer';
import { SesionReducer } from './reducers/sesion.reducer';
// import { TokenReducer } from './reducers/token.reducer';
export interface AppState {
  sesion: ISesion;
  // token: Token;
  main: MainState;
}

export const ROOT_REDUCERS: ActionReducerMap<AppState> = {
  sesion: SesionReducer,
  // token: TokenReducer,
  main: MainReducer,
};
