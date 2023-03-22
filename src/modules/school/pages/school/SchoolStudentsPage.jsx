import React from 'react';
import { LAYOUT, ErrorBlankState, LoadingOverlay } from '@brightwheel/casa';
import { css } from '@emotion/core';
import {
  StudentsListFilters,
  StudentsListSort,
  StudentTable,
  StudentsListPagination,
  useStudentsList,
} from '@kidcasa/students/StudentsList';
import { PageHeader } from '@components/PageHeader/PageHeader';
import AddStudentsDropdown from '../../students/AddStudentsDropdown/AddStudentsDropdown';
import ExportRosterButton from '../../students/ExportRosterButton/ExportRosterButton';

const propTypes = {};

const SchoolStudentsPage = () => {
  const {
    errorMessage,
    filters,
    sortKey,
    handleNextPage,
    // handlePageSize,
    handlePrevPage,
    pagination: { count = 0, page, page_size: pageSize },
    handleAction,
    isFetching,
    resetForm,
    setFilters,
    setSortKey,
    result: { students },
  } = useStudentsList({
    initialFilters: {
      enrollment_status: ['Active'],
      room: '',
      name_like: '',
    },
    storageKey: 'SchoolStudentsPage',
  });

  return (
    <>
      <PageHeader
        actions={
          <div
            css={css`
              display: flex;
              flex-direction: row;
              align-items: center;
              gap: 1rem;
            `}
          >
            <ExportRosterButton filters={filters} />
            <AddStudentsDropdown />
          </div>
        }
      >
        Student List
      </PageHeader>
      <div
        css={css`
          max-width: ${LAYOUT.maxWidth};
          margin: 0 auto 6rem;
          padding: 0 ${LAYOUT.gutter};
        `}
      >
        <div
          css={css`
            margin-bottom: 2rem;
          `}
        >
          <StudentsListFilters onSubmit={setFilters} initialValues={filters} onReset={resetForm} />
        </div>
        <LoadingOverlay isLoading={isFetching}>
          {errorMessage ? (
            <ErrorBlankState
              primaryMessage="There was an error loading the student list"
              secondaryMessage={errorMessage}
              width={'full'}
              variant="generic"
            />
          ) : (
            <>
              <StudentsListSort onSort={setSortKey} sortKey={sortKey} />
              <StudentTable students={students} isFetching={isFetching} onReset={resetForm} onAction={handleAction} />
              <StudentsListPagination
                count={count}
                page={page}
                pageSize={pageSize}
                handleNextPage={handleNextPage}
                handlePrevPage={handlePrevPage}
              />
            </>
          )}
        </LoadingOverlay>
      </div>
    </>
  );
};

SchoolStudentsPage.propTypes = propTypes;
export default SchoolStudentsPage;
