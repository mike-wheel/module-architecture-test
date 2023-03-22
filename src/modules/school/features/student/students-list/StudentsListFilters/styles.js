import { css } from '@emotion/core';
import { MEDIA } from '@brightwheel/casa';

export const filterStyles = {
  wrapper: css`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex-wrap: wrap;
    @media ${MEDIA.md} {
      flex-direction: row;
      flex-wrap: nowrap;
      align-items: center;
    }
  `,
  resetAll: css`
    min-width: 6rem;
  `,
};
