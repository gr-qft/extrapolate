import { GetStaticPropsContext } from "next";
import { useRouter } from "next/router";
import Balancer from "react-wrap-balancer";
import { motion } from "framer-motion";
import { ParsedUrlQuery } from "node:querystring";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import Layout from "@/components/layout";
import { getKey, DataProps } from "@/lib/upstash";
import { FADE_DOWN_ANIMATION_VARIANTS } from "@/lib/constants";
import PhotoBooth from "@/components/home/photo-booth";
import { getPlaiceholder } from "plaiceholder";
import { useUploadModal } from "@/components/home/upload-modal";
import { Upload } from "lucide-react";
import { Toaster } from "react-hot-toast";

export default function PhotoPage({
  input,
  blurDataURL,
  data: fallbackData,
}: {
  input: string;
  blurDataURL: string;
  data: DataProps;
}) {
  const router = useRouter();
  const { id } = router.query;
  const { data } = useSWR<DataProps>(`/api/images/${id}`, fetcher, {
    fallbackData,
  });
  const { UploadModal, setShowUploadModal } = useUploadModal();

  return (
    <Layout>
      <Toaster />
      <UploadModal />
      <motion.div
        className="max-w-2xl px-5 xl:px-0"
        initial="hidden"
        whileInView="show"
        animate="show"
        viewport={{ once: true }}
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.15,
            },
          },
        }}
      >
        <motion.h1
          className="bg-gradient-to-br from-black to-stone-500 bg-clip-text text-center font-display text-4xl font-bold tracking-[-0.02em] text-transparent drop-shadow-sm md:text-7xl md:leading-[5rem]"
          variants={FADE_DOWN_ANIMATION_VARIANTS}
        >
          Your Results
        </motion.h1>
        <motion.p
          className="mt-6 text-center text-gray-500 md:text-xl"
          variants={FADE_DOWN_ANIMATION_VARIANTS}
        >
          <Balancer ratio={0.6}>
            Your photos will be stored in our servers for 24 hours. After that,
            they will be deleted.
          </Balancer>
        </motion.p>
        {data?.expired ? (
          <motion.div
            className="mx-auto mt-10 flex h-[600px] w-[600px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white"
            variants={FADE_DOWN_ANIMATION_VARIANTS}
          >
            <p className="text-sm text-gray-500">
              Your photos have been deleted. Please upload a new photo.
            </p>
            <button
              className="group mx-auto mt-6 flex max-w-fit items-center justify-center space-x-2 rounded-full border border-black bg-black px-5 py-2 text-sm text-white transition-colors hover:bg-white hover:text-black"
              onClick={() => setShowUploadModal(true)}
            >
              <Upload className="h-5 w-5 text-white group-hover:text-black" />
              <p>Upload another photo</p>
            </button>
          </motion.div>
        ) : (
          <PhotoBooth
            input={input}
            blurDataURL={blurDataURL}
            output={data!.output}
            email={data!.email}
          />
        )}
      </motion.div>
    </Layout>
  );
}

export const getStaticPaths = async () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

interface Params extends ParsedUrlQuery {
  id: string;
}

export const getStaticProps = async (
  context: GetStaticPropsContext & { params: Params },
) => {
  const { id } = context.params;
  const input = `https://images.extrapolate.workers.dev/${id}`;
  const data = await getKey(id);
  if (data) {
    const { base64 } = await getPlaiceholder(input);
    return {
      props: {
        input,
        blurDataURL: base64,
        data,
      },
      revalidate: 1,
    };
  } else {
    return { notFound: true, revalidate: 1 };
  }
};