import { useEffect, useState } from 'react';
import {
  AppShell,
  Toolbar,
  Button,
  Spinner,
  AlertDialog,
  Popup,
  ThemeEditor,
  CommandPalette,
  Combobox,
  Tooltip,
  UIGroup,
} from '#toolcrib';
import useFeedStore from './store';
import FeedSidebar from './components/FeedSidebar';
import Dashboard from './components/Dashboard';
import ArticleList from './components/ArticleList';
import Reader from './components/Reader';
import AddFeedModal from './components/AddFeedModal';
import Ticker from './components/Ticker';

export default function App() {
  const {
    feeds,
    articles,
    selectedFeedId,
    setSelectedFeedId,
    openReader,
    loadFromDB,
    refreshAllFeeds,
    resetAll,
    isLoading,
  } = useFeedStore();
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadFromDB();
  }, [loadFromDB]);

  const searchOptions = articles.map((a) => ({ label: a.title, value: String(a.id) }));

  const paletteItems = [
    { value: 'dashboard', label: '🌾 Dashboard', group: 'Navigate', onSelect: () => setSelectedFeedId(null) },
    ...feeds.map((f) => ({
      value: `feed-${f.id}`,
      label: `📡 ${f.title}`,
      group: 'Navigate',
      onSelect: () => setSelectedFeedId(f.id),
    })),
    {
      value: 'refresh-all',
      label: '🔄 Refresh All Feeds',
      group: 'Actions',
      onSelect: refreshAllFeeds,
    },
  ];

  return (
    <AppShell layout="sidebar-left">
      <AppShell.Header>
        <Toolbar>
          <Toolbar.Left>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '1rem' }}>
              🌾 Feed Farmer
            </span>
          </Toolbar.Left>
          <Toolbar.Right>
            {/* header-actions: a plain wrapper -- safe to add around
                UIGroup itself (only UIGroup's own *children* have to stay
                direct children for its corner-merging CSS; a wrapper
                around UIGroup doesn't affect that). Used below to widen
                the search box, which has no width prop of its own. */}
            <div className="header-actions">
              <UIGroup>
                <Combobox
                  placeholder="Search articles… (⌘K for commands)"
                  ariaLabel="Search articles"
                  options={searchOptions}
                  value={searchValue}
                  onChange={(val) => {
                    const article = articles.find((a) => String(a.id) === val);
                    if (article) {
                      openReader(article);
                      setSearchValue('');
                    }
                  }}
                  size="sm"
                />
                <AddFeedModal />
                <Tooltip content="Refresh All">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={isLoading ? <Spinner size="sm" /> : '🔄'}
                    aria-label="Refresh All"
                    onClick={refreshAllFeeds}
                    disabled={isLoading}
                  />
                </Tooltip>
                <Popup
                  id="theme-popup"
                  trigger={
                    <Tooltip content="Theme settings">
                      {/* No manual squareCorners needed as of toolcrib
                          v0.9.0 -- UIGroup now reaches through Popup's own
                          trigger wrapper automatically via UIGroupContext. */}
                      <Button variant="outline" size="sm" icon="🎨" aria-label="Theme settings" />
                    </Tooltip>
                  }
                  placement="bottom-end"
                >
                  <div style={{ width: '20rem', maxHeight: '32rem', overflowY: 'auto', padding: '0.75rem' }}>
                    <ThemeEditor />
                  </div>
                </Popup>
                <AlertDialog
                  id="reset-confirm"
                  trigger={
                    <Tooltip content="Reset">
                      {/* No manual squareCorners needed as of toolcrib
                          v0.9.0 -- same fix, reaches through AlertDialog's
                          trigger wrapper automatically too. */}
                      <Button variant="outline" size="sm" icon="🗑️" aria-label="Reset" />
                    </Tooltip>
                  }
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
              </UIGroup>
            </div>
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
      <CommandPalette items={paletteItems} placeholder="Jump to a feed or run a command…" />
    </AppShell>
  );
}
