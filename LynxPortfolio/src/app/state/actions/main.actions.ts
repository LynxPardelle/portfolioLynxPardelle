import { createAction, props } from '@ngrx/store';
import { Main } from 'src/app/core/models/main';

export const LoadMain = createAction('[Main] Loading Main');
export const MainLoaded = createAction(
  '[Mainn] Main Loaded',
  props<{ main: Main }>()
);
export const ErrorMain = createAction(
  '[Main] Error Main',
  props<{ error: any }>()
);
