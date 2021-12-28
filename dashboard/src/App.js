import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import { QueryClientProvider, QueryClient } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
//route
import Dashboard from "./Dashboard";
import Cohort from "./Cohort";
import Bar from "./Bar";
import Conversion from "./Conversion";
//css
import "./App.css";


const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Switch>
          <Route path="/cohort">
            <Cohort />
          </Route>
          <Route path="/bar">
            <Bar />
          </Route>
          <Route path="/conversion">
            <Conversion />
          </Route>
          <Route path="/">
            <Dashboard />
          </Route>
        </Switch>
      </Router>
      <ReactQueryDevtools initialIsOpem={false} position='bottom-right' />
    </QueryClientProvider>
  );
};

export default App;
