import React from 'react';

export const PhantomIcon = ({ className }: { className?: string }) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM10 9C10 8.44772 10.4477 8 11 8H13C13.5523 8 14 8.44772 14 9V11C14 11.5523 13.5523 12 13 12H11C10.4477 12 10 11.5523 10 11V9ZM11 10V11H13V10H11ZM11 14C10.4477 14 10 14.4477 10 15V17C10 17.5523 10.4477 18 11 18H13C13.5523 18 14 17.5523 14 17V15C14 14.4477 13.5523 14 13 14H11ZM11 15V17H13V15H11Z" 
      fill="currentColor"
    />
  </svg>
);
