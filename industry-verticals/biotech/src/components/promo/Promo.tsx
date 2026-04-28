import React, { JSX } from 'react';
import {
  NextImage as ContentSdkImage,
  RichText as ContentSdkRichText,
  Field,
  ImageField,
  Link,
  LinkField,
  RichTextField,
  Text,
} from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from 'lib/component-props';
import clsx from 'clsx';
import AccentLine from '@/assets/icons/accent-line/AccentLine';
import { Quote } from '@/assets/icons/quote/Quote';
import { CommonStyles, LayoutStyles, PromoFlags } from '@/types/styleFlags';

interface Fields {
  PromoImageOne: ImageField;
  PromoImageTwo: ImageField;
  PromoImageThree: ImageField;
  PromoTitle: Field<string>;
  PromoDescription: RichTextField;
  PromoSubTitle: Field<string>;
  PromoMoreInfo: LinkField;
}

type PromoImageGroupProps = Partial<
  Pick<Fields, 'PromoImageOne' | 'PromoImageTwo' | 'PromoImageThree'>
> & {
  withShapes?: boolean;
  withShadows?: boolean;
};

export type PromoProps = ComponentProps & {
  params: { [key: string]: string };
  fields: Fields;
};

/** Soft elevation for the main photo. */
const isShadowClassActive = (val: boolean) =>
  val ? 'shadow-[0_20px_56px_-14px_rgba(0,0,0,0.14)]' : '';

/** CTA uses mask arrow — underline, label, and arrow fill (#c1a25f); `!` beats section themes. */
const promoArrowBtnAccent =
  '[&_.arrow-btn]:!border-b-[#004d9f] [&_.arrow-btn]:!text-[#004d9f] [&_.arrow-btn::after]:!bg-[#004d9f]';

const promoSurfaceClass = clsx('w-full text-left', promoArrowBtnAccent);

export const PromoContent = ({ ...props }) => {
  const isAccentLineVisible = !props?.params?.styles?.includes(CommonStyles.HideAccentLine);

  return (
    <div
      className={clsx(promoSurfaceClass, 'flex w-full max-w-none flex-col gap-5 sm:gap-6 md:gap-7')}
    >
      <div className="text-xs font-semibold tracking-[0.22em] sm:text-sm">
        <Text field={props.fields.PromoSubTitle} />
      </div>

      <div className="max-w-2xl">
        <h3 className="text-[clamp(1.65rem,3.6vw,2.85rem)] leading-[1.12] font-bold tracking-tight text-[#1e1e1e]">
          <Text field={props.fields.PromoTitle} />
        </h3>
        {isAccentLineVisible && (
          <AccentLine className="mt-3 w-full max-w-[11rem] !text-[#004d9f] sm:max-w-[12rem]" />
        )}
      </div>

      <div className="max-w-2xl text-base leading-relaxed text-[#505050] md:text-lg [&_a]:text-[#505050] [&_a]:underline [&_li]:text-[#505050] [&_p]:m-0 [&_p]:text-[#505050]">
        <ContentSdkRichText field={props.fields.PromoDescription} />
      </div>

      <div className="pt-1">
        <Link field={props.fields.PromoMoreInfo} className="arrow-btn" />
      </div>
    </div>
  );
};

export const SingleImageContainer = ({
  PromoImageOne,
  withShapes,
  withShadows,
}: PromoImageGroupProps): JSX.Element => {
  const shadowClass = isShadowClassActive(withShadows ?? false);
  return (
    <div className="relative w-full">
      {withShapes && (
        <>
          <div
            className="pointer-events-none absolute top-4 left-4 z-0 aspect-[6/5.2] w-[min(70%,15rem)] rounded-2xl bg-[#e8e8e8] sm:w-[min(55%,13rem)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute right-3 bottom-10 z-0 aspect-[5/3] w-[min(75%,16rem)] rounded-2xl bg-[#e8e8e8] sm:bottom-12"
            aria-hidden
          />
        </>
      )}
      <div
        className={clsx(
          'relative z-10 aspect-[4/3] w-full overflow-hidden rounded-t-2xl sm:aspect-[16/10]',
          shadowClass
        )}
      >
        <ContentSdkImage field={PromoImageOne} className="h-full w-full object-cover" />
      </div>
    </div>
  );
};

export const MultipleImageContainer = ({
  PromoImageOne,
  PromoImageTwo,
  PromoImageThree,
  withShapes,
  withShadows,
}: PromoImageGroupProps): JSX.Element => {
  const shadowClass = isShadowClassActive(withShadows ?? false);
  const marginClass = withShapes ? 'mr-4' : '';

  return (
    <>
      <div className="flex flex-col items-center gap-8 md:flex-row">
        <div className="flex flex-col gap-10 md:w-1/3">
          <div className="relative aspect-square overflow-visible rounded-2xl">
            <div
              className={`relative z-10 h-full w-full overflow-hidden rounded-2xl ${shadowClass}`}
            >
              <ContentSdkImage field={PromoImageTwo} className="h-full w-full object-cover" />
            </div>
          </div>
          <div className="relative aspect-2/3 overflow-visible rounded-2xl">
            <div
              className={`relative z-10 h-full w-full overflow-hidden rounded-2xl ${shadowClass}`}
            >
              <ContentSdkImage field={PromoImageThree} className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
        <div className="relative w-full md:w-2/3">
          {withShapes && (
            <div className="bg-background-muted absolute right-0 z-0 aspect-[495/422] w-3/4 rounded-2xl md:-top-10 xl:-top-15"></div>
          )}
          <div className={`relative aspect-3/2 overflow-visible rounded-2xl ${marginClass} z-10`}>
            <div
              className={`relative z-10 h-full w-full overflow-hidden rounded-2xl ${shadowClass}`}
            >
              <ContentSdkImage
                field={PromoImageOne}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const Default = (props: PromoProps): JSX.Element => {
  const id = props.params.RenderingIdentifier;
  const showSingleImage = !props?.params?.styles?.includes(PromoFlags.ShowMultipleImages);
  const withShapes = !props?.params?.styles?.includes(PromoFlags.HidePromoShapes);
  const withShadows = !props?.params?.styles?.includes(PromoFlags.HidePromoShadows);

  return (
    <section
      className={clsx(props.params.styles, 'py-2 md:py-4 lg:py-6')}
      id={id ? id : undefined}
    >
      <div className="container">
        <div
          className={clsx(
            'border-border mx-auto max-w-5xl overflow-hidden rounded-2xl border shadow-md',
            promoSurfaceClass
          )}
        >
          <div className="relative w-full shrink-0">
            {showSingleImage ? (
              <SingleImageContainer
                PromoImageOne={props.fields.PromoImageOne}
                withShapes={withShapes}
                withShadows={withShadows}
              />
            ) : (
              <div className="rounded-t-2xl">
                <MultipleImageContainer
                  PromoImageOne={props.fields.PromoImageOne}
                  PromoImageTwo={props.fields.PromoImageTwo}
                  PromoImageThree={props.fields.PromoImageThree}
                  withShapes={withShapes}
                  withShadows={withShadows}
                />
              </div>
            )}
          </div>
          <div className="bg-background-muted px-6 py-8 !text-left md:px-10 md:py-10 [&_*]:!text-left">
            <PromoContent {...props} />
          </div>
        </div>
      </div>
    </section>
  );
};

export const WithFullImage = (props: PromoProps): JSX.Element => {
  const id = props.params.RenderingIdentifier;

  return (
    <section
      className={clsx(props.params.styles, 'py-14 md:py-16 lg:py-20')}
      id={id ? id : undefined}
    >
      <div className="container">
        <div
          className={clsx(
            'border-border mx-auto max-w-5xl overflow-hidden rounded-2xl border shadow-md',
            promoSurfaceClass
          )}
        >
          <div className="relative w-full shrink-0">
            <SingleImageContainer
              PromoImageOne={props.fields.PromoImageTwo}
              withShapes
              withShadows
            />
          </div>
          <div className="bg-background-muted px-6 py-8 !text-left md:px-10 md:py-10 [&_*]:!text-left">
            <PromoContent {...props} />
          </div>
        </div>
      </div>
    </section>
  );
};

export const WithQuote = (props: PromoProps): JSX.Element => {
  const id = props.params.RenderingIdentifier;
  const withQuote = !props?.params?.styles?.includes(PromoFlags.HidePromoQuotes);
  const isReversed = !props?.params?.styles?.includes(LayoutStyles.Reversed);

  const classesWhenReversed = {
    container: isReversed ? 'container-align-left' : 'container-align-right',
    contentOrder: isReversed ? 'order-1 lg:order-2' : 'order-2 lg:order-1',
    imageTransform: isReversed
      ? '-translate-x-[10%] xl:-translate-x-[20%]'
      : 'translate-x-[10%] xl:translate-x-[15%]',
    quoteFlip: isReversed ? '' : 'lg:-scale-x-100',
  };

  return (
    <section
      className={`relative ${props.params.styles} z-10 overflow-hidden pb-15 xl:pb-[4%]`}
      id={id ? id : undefined}
    >
      {withQuote && (
        <div
          className={`absolute left-5 md:top-[10%] lg:top-[25%] lg:left-1/2 lg:-translate-x-1/2 ${classesWhenReversed.quoteFlip} } text-background-accent! z-20`}
        >
          <Quote className="h-10 md:h-20 lg:h-25 xl:h-30" />
        </div>
      )}
      <div>
        <div className={`${classesWhenReversed.container} `}>
          <div className={`grid grid-cols-1 lg:grid-cols-3 lg:gap-0`}>
            <div
              className={`relative mt-10 flex items-center justify-center lg:col-span-1 ${classesWhenReversed.contentOrder}`}
            >
              <div className="text-foreground! mb-5 max-w-sm">
                <PromoContent {...props} />
              </div>
            </div>

            <div
              className={`relative z-30 order-2 mb-2 aspect-2/1 w-full translate-y-[25%] scale-100 place-self-end lg:order-1 lg:col-span-2 lg:h-3/4 xl:scale-90 ${classesWhenReversed.imageTransform}`}
            >
              <ContentSdkImage
                field={props.fields.PromoImageOne}
                className="absolute inset-0 h-full w-full rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
