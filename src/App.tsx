import { useEffect } from 'react';
import { AppShell, Toolbar, Button, Spinner, AlertDialog } from '#toolcrib';
import useFeedStore from './store';
import FeedSidebar from './components/FeedSidebar';
import Dashboard from './components/Dashboard';
import ArticleList from './components/ArticleList';
import Reader from './components/Reader';
import AddFeedModal from './components/AddFeedModal';
import Ticker from './components/Ticker';

export default function App() {
  const { selectedFeedId, loadFromDB, refreshAllFeeds, resetAll, isLoading } = useFeedStore();

  useEffect(() => {
    loadFromDB();
  }, [loadFromDB]);

  return (
    <>
      <Ticker />
      <AppShell layout="sidebar-left">
        <AppShell.Header>
          <Toolbar>          <Toolbar.Left>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '1rem' }}>
              🌾 Feed Farmer
            </span>
          </Toolbar.Left>
          <Toolbar.Right>
            <AddFeedModal />
            <Button
              variant="ghost"
              size="sm"
              icon="🔄"
              onClick={refreshAllFeeds}
              disabled={isLoading}
            >
              {isLoading ? <Spinner size="sm" /> : 'Refresh All'}
            </Button>
            <AlertDialog
              id="reset-confirm"
              trigger={<Button variant="ghost" size="sm" icon="🗑️">Reset</Button>}
              ariaLabel="Confirm reset"
            >
              <AlertDialog.Header>Reset All Data?</AlertDialog.Header>
              <AlertDialog.Body>
                This will delete all feeds, articles, and read/star states. The app will reload with the default feeds.
              </AlertDialog.Body>
              <AlertDialog.Actions>
                <AlertDialog.Cancel />
                <AlertDialog.Action onClick={resetAll}>Reset Everything</AlertDialog.Action>
              </AlertDialog.Actions>
            </AlertDialog>
          </Toolbar.Right>
        </Toolbar>
        <Ticker />
      </AppShell.Header>

      <AppShell.Sidebar>
        <FeedSidebar />
      </AppShell.Sidebar>

      <AppShell.Main>
        {selectedFeedId ? <ArticleList /> : <Dashboard />}
      </AppShell.Main>

      <Reader />
    </AppShell>
  );
}

