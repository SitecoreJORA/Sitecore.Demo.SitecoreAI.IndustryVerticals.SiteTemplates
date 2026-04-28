import {
  Field,
  ImageField,
  LinkField,
  NextImage as ContentSdkImage,
  Text as ContentSdkText,
  RichText as ContentSdkRichText,
  useSitecore,
  Placeholder,
  Link,
} from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from '@/lib/component-props';
import AccentLine from '@/assets/icons/accent-line/AccentLine';
import { CommonStyles, HeroBannerStyles, LayoutStyles } from '@/types/styleFlags';
import clsx from 'clsx';

/** Split hero panel / CTA text color (matches design reference). */
const HERO_SPLIT_BRAND_BLUE = '#00529B';

interface Fields {
  Image: ImageField;
  Video: ImageField;
  Title: Field<string>;
  Description: Field<string>;
  CtaLink: LinkField;
}

interface HeroBannerProps extends ComponentProps {
  fields: Fields;
}

function HeroBannerMedia({
  fields,
  isPageEditing,
  className,
}: {
  fields: Fields;
  isPageEditing: boolean;
  className?: string;
}) {
  if (!isPageEditing && fields?.Video?.value?.src) {
    return (
      <video
        className={clsx('size-full object-cover', className)}
        autoPlay
        muted
        loop
        playsInline
        poster={fields.Image?.value?.src}
      >
        <source src={fields.Video?.value?.src} type="video/webm" />
      </video>
    );
  }

  return <ContentSdkImage field={fields.Image} className={className} priority />;
}

const HeroBannerCommon = ({
  params,
  fields,
  children,
}: HeroBannerProps & {
  children: React.ReactNode;
}) => {
  const { page } = useSitecore();
  const { styles, RenderingIdentifier: id } = params;
  const isPageEditing = page.mode.isEditing;
  const hideGradientOverlay = styles?.includes(HeroBannerStyles.HideGradientOverlay);

  if (!fields) {
    return isPageEditing ? (
      <div className={`component hero-banner ${styles}`} id={id}>
        [HERO BANNER]
      </div>
    ) : (
      <></>
    );
  }

  return (
    <div className={`component hero-banner ${styles} relative flex items-center`} id={id}>
      <div className="absolute inset-0 z-0">
        {!isPageEditing && fields?.Video?.value?.src ? (
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={fields.Image?.value?.src}
          >
            <source src={fields.Video?.value?.src} type="video/webm" />
          </video>
        ) : (
          <ContentSdkImage
            field={fields.Image}
            className="h-full w-full object-cover md:object-bottom"
            priority
          />
        )}
        {!hideGradientOverlay && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-85% to-white"></div>
        )}
      </div>

      {children}
    </div>
  );
};

export const Default = ({ params, fields, rendering }: HeroBannerProps) => {
  const { page } = useSitecore();
  const isPageEditing = page.mode.isEditing;
  const styles = params.styles || '';
  const { RenderingIdentifier: id } = params;
  const withPlaceholder = styles.includes(HeroBannerStyles.WithPlaceholder);
  const reverseLayout = styles.includes(LayoutStyles.Reversed);
  const screenLayer = styles.includes(HeroBannerStyles.ScreenLayer);
  const searchBarPlaceholderKey = `hero-banner-search-bar-${params.DynamicPlaceholderId}`;

  const descriptionHtml = fields?.Description?.value;
  const hasEyebrowContent =
    typeof descriptionHtml === 'string'
      ? descriptionHtml
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/gi, '')
          .trim().length > 0
      : Boolean(descriptionHtml);

  if (!fields) {
    return isPageEditing ? (
      <div className={`component hero-banner ${styles}`} id={id}>
        [HERO BANNER]
      </div>
    ) : (
      <></>
    );
  }

  const splitCtaClassName =
    'inline-flex w-fit items-center justify-center rounded-full bg-white px-8 py-3.5 text-base font-semibold !no-underline shadow-sm transition hover:bg-white/95 hover:shadow-md focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none [&::after]:hidden';

  return (
    <div className={clsx('component hero-banner relative w-full overflow-hidden', styles)} id={id}>
      <div
        className={clsx(
          'flex w-full flex-col md:min-h-[17.5rem] lg:min-h-[30rem]',
          reverseLayout ? 'md:flex-row-reverse' : 'md:flex-row'
        )}
      >
        <div
          className={clsx(
            'relative z-10 flex w-full shrink-0 flex-col justify-center px-6 py-10 sm:px-10 md:w-[45%] md:px-12 md:py-14 lg:px-16 lg:py-16',
            'text-white',
            reverseLayout ? 'md:rounded-tl-[1.875rem]' : 'md:rounded-tr-[1.875rem]'
          )}
          style={{ backgroundColor: HERO_SPLIT_BRAND_BLUE }}
        >
          <div className={clsx('max-w-xl', { shim: screenLayer })}>
            {(hasEyebrowContent || isPageEditing) && (
              <div className="mb-5 text-sm font-normal tracking-wide text-white sm:text-[0.9375rem] [&_.ck-content]:!text-white [&_a]:!text-white [&_a:hover]:!text-white/90 [&_div]:!text-white [&_em]:!text-white [&_p]:!mb-0 [&_p]:!leading-snug [&_p]:!text-white [&_span]:!text-white [&_strong]:!text-white">
                <ContentSdkRichText
                  field={fields.Description}
                  className="[&_.ck-content_p]:!text-white [&_p]:!m-0 [&_p]:!text-white"
                />
              </div>
            )}
            <h1 className="text-3xl leading-[1.12] font-bold tracking-tight !text-white sm:text-4xl lg:text-[2.25rem] lg:leading-[1.14] xl:text-[2.625rem] xl:leading-[1.12] [&_*]:!text-white">
              <ContentSdkText field={fields.Title} />
            </h1>

            <div className="mt-9 flex w-full justify-start">
              {withPlaceholder ? (
                <Placeholder name={searchBarPlaceholderKey} rendering={rendering} />
              ) : (
                <Link
                  field={fields.CtaLink}
                  className={splitCtaClassName}
                  style={{ color: HERO_SPLIT_BRAND_BLUE }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="relative h-56 min-h-[14rem] w-full md:h-auto md:min-h-0 md:flex-1">
          <HeroBannerMedia
            fields={fields}
            isPageEditing={isPageEditing}
            className="absolute inset-0 size-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export const TopContent = ({ params, fields, rendering }: HeroBannerProps) => {
  const styles = params.styles || '';
  const hideAccentLine = styles.includes(CommonStyles.HideAccentLine);
  const withPlaceholder = styles.includes(HeroBannerStyles.WithPlaceholder);
  const reverseLayout = styles.includes(LayoutStyles.Reversed);
  const screenLayer = styles.includes(HeroBannerStyles.ScreenLayer);
  const searchBarPlaceholderKey = `hero-banner-search-bar-${params.DynamicPlaceholderId}`;

  return (
    <HeroBannerCommon params={params} fields={fields} rendering={rendering}>
      <div className="relative w-full">
        <div className="container mx-auto flex min-h-238 justify-center px-4">
          <div
            className={`flex flex-col items-center py-10 lg:py-44 ${reverseLayout ? 'justify-end' : 'justify-start'}`}
          >
            <div className={clsx({ shim: screenLayer })}>
              <h1 className="text-center text-5xl leading-[110%] font-bold capitalize md:text-7xl md:leading-[130%] xl:text-[80px]">
                <ContentSdkText field={fields.Title} />
                {!hideAccentLine && <AccentLine className="mx-auto !h-5 w-[9ch]" />}
              </h1>

              <div className="mt-7 text-xl md:text-2xl">
                <ContentSdkRichText field={fields.Description} className="text-center" />
              </div>

              <div className="mt-6 flex w-full justify-center">
                {withPlaceholder ? (
                  <Placeholder name={searchBarPlaceholderKey} rendering={rendering} />
                ) : (
                  <Link field={fields.CtaLink} className="arrow-btn" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </HeroBannerCommon>
  );
};
