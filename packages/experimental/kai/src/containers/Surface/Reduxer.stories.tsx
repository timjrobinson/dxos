//
// Copyright 2023 DXOS.org
//

import React, { createContext, PropsWithChildren, Reducer, useContext, useEffect, useMemo, useReducer } from 'react';
import { useParams } from 'react-router-dom';

import { PublicKey } from '@dxos/keys';

type AppState = {
  navigator?: string;
  space?: PublicKey;
  objectId?: string;
  frame?: string;
  fullscreen?: boolean;
};

type AppAction = {};

class Controller<S, A> {
  _state?: S;
  constructor(readonly dispatch: (action: A) => void) {}
  setState(state: S) {
    this._state = state;
  }
}

type ControllerContextType<S, A> = { controller: Controller<S, A> };

const ControllerContext = createContext<Partial<ControllerContextType<S, A>>>({});

type ControllerProviderProps<S, A> = {
  reducer: (state: S, action: A) => S;
  initialState: S;
};

const ControllerProvider = <S, A>({
  children,
  reducer,
  initialState
}: PropsWithChildren<ControllerProviderProps<S, A>>) => {
  const params = useParams();
  const [state, dispatch] = useReducer<Reducer<S, A>>(reducer, initialState);
  const controller = useMemo(() => new Controller<S, A>(dispatch), []);
  controller.setState(state);

  useEffect(() => {}, [params]);

  return <ControllerContext.Provider value={{ controller }}>{children}</ControllerContext.Provider>;
};

const useController = () => {
  const { controller } = useContext(ControllerContext);
  return controller;
};

const Test = () => {
  controller = useController();
  return <div>Test</div>;
};

const App = () => {
  const reducer = (state: AppState, action: AppAction): AppState => state;
  const mapParamsToState = (params: any): AppState => ({});
  return (
    <ControllerProvider<AppState, AppAction> reducer={reducer} initialState={{}}>
      <Test />
    </ControllerProvider>
  );
};
