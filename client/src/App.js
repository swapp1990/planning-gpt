import React, { lazy, useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  useLocation,
} from "react-router-dom";
import { Provider } from "react-redux";
import store from "./stores";
import MainLayout from "./MainLayout";

import { EbookProvider } from "./context/EbookContext";

import BottomNavigation from "./components/BottomNavigation";
import HomePage from "./pages/home/HomePage";
import BookView from "./pages/ebook/BookView";
import TestPage from "./pages/TestPage";
import RewritingDemo from "./pages/ebook/RewritingDemo";
import Login from "./pages/Login";

function App() {
  return (
    <>
      <Provider store={store}>
        <EbookProvider>
          <Router>
            <MainLayout>
              <Switch>
                <Route path="/login" component={Login} />
                <Route path="/home" exact component={BookView} />
                <Route path="/demo" exact component={RewritingDemo} />
                <Route path="/" exact component={BookView} />
              </Switch>
            </MainLayout>
          </Router>
        </EbookProvider>
      </Provider>
    </>
  );
}

export default App;
