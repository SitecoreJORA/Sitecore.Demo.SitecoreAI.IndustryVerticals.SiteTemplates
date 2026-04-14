'use client';

import { ComponentProps } from '@/lib/component-props';
import {
  ComponentParams,
  ComponentRendering,
  NextImage as ContentSdkImage,
  Text,
  TextField,
  useSitecore,
} from '@sitecore-content-sdk/nextjs';
import React, { useCallback, useState } from 'react';
import ShortArrow from '@/assets/icons/arrow-short/ArrowShort';
import { ReviewFields } from '@/types/review';

const REVIEW_ACCENT = '#2B4360';
const REVIEW_SURFACE = 'transparent';

function QuoteMarkIcon({ className }: { className?: string }) {
  return (
    <span
      className={`block font-serif text-4xl leading-none select-none md:text-5xl ${className ?? ''}`}
      style={{ color: REVIEW_ACCENT }}
      aria-hidden
    >
      &ldquo;
    </span>
  );
}

interface ReviewsProps extends ComponentProps {
  rendering: ComponentRendering & { params: ComponentParams };
  params: { [key: string]: string };
  fields: {
    Title: TextField;
    Eyebrow: TextField;
    Reviews: ReviewFields[];
  };
}

export const Default = (props: ReviewsProps) => {
  const { page } = useSitecore();
  const [activeIndex, setActiveIndex] = useState(0);

  const id = props.params.RenderingIdentifier;
  const reviews = props.fields?.Reviews || [];
  const styles = `${props.params.styles || ''}`.trim();
  const isPageEditing = page.mode.isEditing;

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + reviews.length) % reviews.length);
  }, [reviews.length]);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % reviews.length);
  }, [reviews.length]);

  if (reviews.length === 0) {
    return (
      <div className={`${styles}`} id={id} style={{ backgroundColor: REVIEW_SURFACE }}>
        <div className="container py-16">
          {isPageEditing ? (
            <p className="text-center text-neutral-600">Add reviews in the Experience Editor.</p>
          ) : null}
        </div>
      </div>
    );
  }

  const review = reviews[activeIndex];
  const { Description, ReviewerName, Caption, ReviewImage } = review.fields;
  const descriptionText =
    Description?.value !== undefined && Description?.value !== null
      ? String(Description.value).trim()
      : '';
  const quoteVisible = isPageEditing || descriptionText.length > 0;
  const imageVisible = Boolean(ReviewImage?.value?.src) || isPageEditing;
  const showNav = reviews.length > 1;

  return (
    <div className={`${styles}`} id={id} style={{ backgroundColor: REVIEW_SURFACE }}>
      <div className="container py-14 md:py-20">
        <div
          key={review.id}
          className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-20"
        >
          <div className="flex min-h-[280px] flex-col justify-between gap-8 lg:min-h-0 lg:pr-4">
            <div className="m-auto flex flex-col gap-6">
              <QuoteMarkIcon className="shrink-0" />
              {quoteVisible ? (
                <blockquote className="m-0 border-none p-0">
                  <Text
                    field={Description}
                    tag="p"
                    className="text-lg leading-relaxed font-medium text-neutral-900 md:text-xl md:leading-relaxed"
                  />
                </blockquote>
              ) : null}
            </div>

            <div className="flex justify-end gap-4" style={{ color: REVIEW_ACCENT }}>
              <button
                type="button"
                onClick={goPrev}
                disabled={!showNav}
                className="inline-flex size-10 items-center justify-center transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-35"
                style={{ outlineColor: REVIEW_ACCENT }}
                aria-label="Previous review"
              >
                <ShortArrow className="rotate-180" />
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!showNav}
                className="inline-flex size-10 items-center justify-center transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-35"
                style={{ outlineColor: REVIEW_ACCENT }}
                aria-label="Next review"
              >
                <ShortArrow />
              </button>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-md lg:mx-0 lg:max-w-none">
            {imageVisible ? (
              <ContentSdkImage
                field={ReviewImage}
                className="size-full object-cover"
                sizes="(min-width: 1024px) 50vw, 90vw"
              />
            ) : (
              <div
                className="flex size-full items-center justify-center bg-neutral-300 text-neutral-600"
                aria-hidden
              >
                Image
              </div>
            )}
            <div
              className="absolute inset-x-0 bottom-0 px-5 py-4 md:px-6 md:py-5"
              style={{ backgroundColor: 'rgba(43, 67, 96, 0.92)' }}
            >
              {(ReviewerName?.value || isPageEditing) && (
                <Text
                  field={ReviewerName}
                  tag="p"
                  className="mb-1 text-base leading-snug font-bold text-white md:text-lg"
                />
              )}
              {(Caption?.value || isPageEditing) && (
                <Text
                  field={Caption}
                  tag="p"
                  className="text-sm leading-snug font-normal text-white/95 md:text-[0.9375rem]"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
