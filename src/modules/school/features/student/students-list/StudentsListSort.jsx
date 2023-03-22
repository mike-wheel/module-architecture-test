import React from 'react';
import { func, string } from 'prop-types';
import * as R from 'ramda';
import { DropdownButton } from 'casa';
import analytics, { events } from 'kidcasa/util/analytics';
import { css } from '@emotion/core';
import { sortByOptions } from './constants';

const propTypes = {
  sortKey: string.isRequired,
  onSort: func.isRequired,
};

const StudentsListSort = ({ onSort, sortKey }) => {
  const dropdownOptions = sortByOptions.map(option => {
    return {
      id: option.key,
      name: option.label,
      onSelect: () => {
        onSort(option.key);
        analytics.track(events.sort_students, { key: option.key });
      },
    };
  });

  const sortLabel = R.compose(
    R.prop('label'),
    R.find(option => option.key === sortKey)
  )(sortByOptions);

  // if the sortKey isn't valid, don't render and show an error in the console
  if (!sortLabel) {
    console.error(`StudentListSort: sortKey ${sortKey} not found!`);
    return null;
  }

  return (
    <div
      css={css`
        display: flex;
        align-items: center;
        padding-bottom: 0.5rem;
      `}
    >
      <p>Sort by: </p>
      <DropdownButton label={sortLabel} size={'md'} options={dropdownOptions} variant={'action'} dropdownRight />
    </div>
  );
};

StudentsListSort.propTypes = propTypes;
export default StudentsListSort;
