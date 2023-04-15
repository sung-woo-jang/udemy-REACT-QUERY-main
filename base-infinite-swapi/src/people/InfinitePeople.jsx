import InfiniteScroll from 'react-infinite-scroller';
import { Person } from './Person';
import { useInfiniteQuery } from 'react-query';
import { Fragment } from 'react';

const initialUrl = 'https://swapi.dev/api/people/';
const fetchUrl = async (url) => {
    const response = await fetch(url);
    return response.json();
};

// 메인 컨텐츠
export function InfinitePeople() {
    // TODO: get data for InfiniteScroll via React Query
    const { data, fetchNextPage, hasNextPage, isLoading, isFetching, isError, error } =
        useInfiniteQuery(
            'sw-people',
            ({ pageParam = initialUrl }) => fetchUrl(pageParam),
            { getNextPageParam: (lastPage) => lastPage.next || undefined }
        );

    if (isLoading) return <div className="loading">Loading...</div>;
    if (isError) return <div className="error">Error {error.toString()}</div>;

    return (
        <Fragment>
            {isFetching && <div className="loading">Loading...</div>}
            <InfiniteScroll loadMore={fetchNextPage} hasMore={hasNextPage}>
                {data.pages.map((pageData) =>
                    pageData.results.map((person) => (
                        <Person
                            key={person.name}
                            name={person.name}
                            hairColor={person.hair_color}
                            eyeColor={person.eye_color}
                        />
                    ))
                )}
            </InfiniteScroll>
        </Fragment>
    );
}
