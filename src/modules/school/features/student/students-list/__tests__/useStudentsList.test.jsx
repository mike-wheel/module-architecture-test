import { renderHook } from '@testing-library/react-hooks';
import { setupServer, rest } from '@mswServer';
import { getRoomsMock } from './rooms.mock';
import { getStudentsMock } from './students.mock';
import { useStudentsList } from '../useStudentsList';
import { waitFor } from '@testing-library/react';
import { act } from '@testing-library/react-hooks';
import { getRoomStudentsMock } from './room-students.mock';

import { useSession } from 'kidcasa/session';

const mockPushNotification = jest.fn();
jest.mock('@brightwheel/casa', () => {
  const originalModule = jest.requireActual('@brightwheel/casa');
  return {
    ...originalModule,
    useNotifications: () => ({
      pushNotification: mockPushNotification,
    }),
  };
});

jest.mock('kidcasa/session');

jest.mock('axios', () => {
  const originalModule = jest.requireActual('axios');
  return originalModule;
});

const server = setupServer(
  rest.get(`${global.API_URL}/api/v1/schools/:school_id/rooms`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json(getRoomsMock()))
  ),
  rest.get(`${global.API_URL}/api/v1/schools/:school_id/students`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json(getStudentsMock()))
  ),
  rest.get(`${global.API_URL}/api/v1/rooms/:room_id/students`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json(getRoomStudentsMock()))
  )
);

const errorResponse400 = (req, res, ctx) =>
  res(
    ctx.status(400),
    ctx.json({
      _errors: [
        {
          title: 'Bad Request',
          message: 'Error message!',
        },
      ],
    })
  );

useSession.mockImplementation(() => ({
  school: {
    object_id: 'test-school-id',
  },
}));

beforeEach(() => {
  server.resetHandlers();
  localStorage.clear();
});

afterAll(() => {
  server.close();
});

const INITIAL_FILTERS = {
  enrollment_status: ['Active'],
  room: '',
  name_like: '',
};

describe('useStudentsList', () => {
  const renderAndWaitForLoader = async (initialFilters = INITIAL_FILTERS, storageKey = 'test-storage-key') => {
    const { result } = renderHook(() => useStudentsList({ initialFilters, storageKey }));

    await act(async () => {
      await waitFor(() => expect(result.current.isFetching).toBe(true));
      await waitFor(() => expect(result.current.isFetching).toBe(false));
    });

    return result;
  };

  it('should render and fetch data', async () => {
    const result = await renderAndWaitForLoader();

    expect(result.current.result).toHaveProperty('students');
    expect(result.current.result).toHaveProperty('count');
    expect(result.current.result).toHaveProperty('page');
    expect(result.current.result).toHaveProperty('page_size');
  });

  it('should save filters in localStorage', async () => {
    const result = await renderAndWaitForLoader();
    const updatedFilters = {
      enrollment_status: ['Active'],
      room: 'fc969dd4-ba31-44ac-b6e3-6b58ae43bce2',
      name_like: 'George Harrison',
    };

    act(() => {
      result.current.setFilters(updatedFilters);
    });

    expect(JSON.parse(localStorage.getItem('test-storage-key')).filters).toStrictEqual(updatedFilters);
  });

  it('should set filters saved in localStorage as the initial filter value (1)', async () => {
    const updatedFilters = {
      enrollment_status: ['Active'],
      room: 'fc969dd4-ba31-44ac-b6e3-6b58ae43bce2',
      name_like: 'George Harrison',
    };
    localStorage.setItem('test-storage-key', JSON.stringify({ filters: updatedFilters }));

    const result = await renderAndWaitForLoader();

    expect(result.current.filters).toStrictEqual(updatedFilters);
  });

  it('should set filters saved in localStorage as the initial filter value (2)', async () => {
    const updatedFilters = {
      enrollment_status: ['Active'],
      room: 'fc969dd4-ba31-44ac-b6e3-6b58ae43bce2',
      name_like: 'George Harrison',
    };
    localStorage.setItem('test-storage-key', JSON.stringify({ filters: updatedFilters }));

    const result = await renderAndWaitForLoader();

    expect(result.current.filters).toStrictEqual(updatedFilters);
  });

  it('should set an error message and show a push notification if the call to get students fails', async () => {
    server.use(rest.get(`${global.API_URL}/api/v1/schools/:school_id/students`, errorResponse400));

    const result = await renderAndWaitForLoader();

    expect(result.current.errorMessage).toBe('Error message!');
    await waitFor(() =>
      expect(mockPushNotification).toHaveBeenCalledWith({ message: 'Error message!', type: 'error' })
    );
  });
});
