import { useCallback, useEffect } from 'react';
import * as R from 'ramda';
import { fetchStudents } from '../students.data.js';
import { useFetch, useNotifications, useLocalStorage } from '@brightwheel/casa';
import { useSession } from '@kidcasa/session/SessionContext.jsx';
import { parseError } from '@util/parse-error.js';
import { sortByOptions } from '../../students/StudentsList/constants.js';

const initialSortKey = sortByOptions[0]?.key;

const useStudentListLocalStorage = ({ storageKey, initialFilters }) => {
  const [localStorageState, setLocalStorageState] = useLocalStorage(storageKey, {
    filters: initialFilters,
    sortKey: initialSortKey,
  });

  // useLocalStorage doesn't support update functions, eg, settLocalStorageState(state => ({ ...state, filters })
  // using R.mergeDeepRight to support updating a single filter and maintaining the other selected filters
  const setFilters = useCallback(filters => setLocalStorageState(R.mergeDeepRight(localStorageState, { filters })), [
    localStorageState,
    setLocalStorageState,
  ]);

  const setSortKey = useCallback(sortKey => setLocalStorageState({ ...localStorageState, sortKey }), [
    localStorageState,
    setLocalStorageState,
  ]);

  return {
    filters: localStorageState.filters,
    sortKey: localStorageState.sortKey,
    setFilters,
    setSortKey,
  };
};

const handlePaginationClick = fn => (...args) => {
  window.scrollTo({ top: 0 });
  fn(...args);
};

export const useStudentsList = ({ initialFilters, storageKey }) => {
  const session = useSession();

  const { pushNotification } = useNotifications();

  const { filters, sortKey, setFilters, setSortKey } = useStudentListLocalStorage({ storageKey, initialFilters });

  const fetchStudentsForSchool = useCallback(
    params => fetchStudents(session?.school?.object_id, { ...params, order: sortKey }),
    [session, sortKey]
  );

  // TODO useFetch does not load the initial values from the localStorage, despite them being passed here as `filter`
  // (try setting enrollment status to "toured" and refresh the page)
  // This might be a good time to explore using react-query https://brightwheel.atlassian.net/browse/COR-2755
  const [
    { result, errors, isFetching, pagination },
    { setParams, handlePageSize, handleNextPage, handlePrevPage, handlePageChange },
  ] = useFetch(fetchStudentsForSchool, filters);

  const errorMessage = errors ? parseError(errors) : undefined;

  useEffect(() => {
    if (errorMessage) {
      pushNotification({ message: errorMessage, type: 'error' });
    }
  }, [errorMessage, pushNotification]);

  const setFiltersParamsAndResetPage = useCallback(
    filters => {
      setFilters(filters);
      handlePageChange(0); // reset the page to 0 on all filter changes
      setParams(filters);
    },
    [setFilters, setParams, handlePageChange]
  );

  const handleAction = useCallback(
    action => {
      if (action.type !== 'error') {
        setParams(n => ({ ...n })); // hack to force a refesh of the table data
      }
      pushNotification(action);
    },
    [pushNotification, setParams]
  );

  const resetForm = useCallback(() => setFiltersParamsAndResetPage(initialFilters), [
    initialFilters,
    setFiltersParamsAndResetPage,
  ]);

  const setSortKeyAndResetPage = useCallback(
    (...args) => {
      setSortKey(...args);
      handlePageChange(0); // reset page to 0 when the sort changes
    },
    [setSortKey, handlePageChange]
  );

  return {
    errorMessage,
    handleNextPage: handlePaginationClick(handleNextPage),
    handlePageSize: handlePaginationClick(handlePageSize),
    handlePrevPage: handlePaginationClick(handlePrevPage),
    pagination,
    isFetching,
    resetForm,
    filters,
    sortKey,
    setSortKey: setSortKeyAndResetPage,
    setFilters: setFiltersParamsAndResetPage,
    result: result ?? [],
    handleAction,
  };
};
