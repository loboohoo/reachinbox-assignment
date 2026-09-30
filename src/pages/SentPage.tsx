import React, { useState, useEffect } from 'react';
import { SearchBar } from '../components/email/SearchBar';
import { FilterButton } from '../components/email/FilterButton';
import { EmailList } from '../components/email/EmailList';
import { useApp } from '../context/AppContext';
import type { Email } from '../types';

export const SentPage: React.FC = () => {
  const { sentEmails, refreshData, searchEmails } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Email[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Perform search query via backend Elasticsearch / PostgreSQL endpoint
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchEmails(searchQuery);
        if (isMounted) {
          // Filter to sent emails
          setSearchResults(results.filter((e) => e.status === 'sent'));
        }
      } catch {
        if (isMounted) setSearchResults([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, searchEmails]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await refreshData();
    setIsLoading(false);
  };

  const displayEmails = searchResults !== null
    ? searchResults
    : sentEmails;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 space-y-4 font-sans min-h-[calc(100vh-6rem)]">
      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <FilterButton onRefreshClick={handleRefresh} isRefreshing={isLoading} />
      </div>

      {/* Main Sent Email List */}
      <EmailList
        emails={displayEmails}
        isLoading={isLoading}
        emptyMessage={
          searchQuery
            ? `No sent emails matching "${searchQuery}"`
            : 'No sent emails found.'
        }
      />
    </div>
  );
};
