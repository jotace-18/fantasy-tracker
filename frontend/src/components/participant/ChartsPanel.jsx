import { Box, Flex, Skeleton } from '@chakra-ui/react';
import CumulativePointsChart from '../../components/CumulativePointsChart';
import CumulativeRankChart from '../../components/CumulativeRankChart';

export default function ChartsPanel({ sectionBg, loadingCumulative, cumulativeHistory, loadingCumulativeRank, cumulativeRankHistory }) {
  return (
    <Box mb={8} p={4} borderRadius="lg" bg={sectionBg} _dark={{ bg: 'gray.700' }}>
      <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
        <Box flex={1} minW={0}>
          {loadingCumulative ? <Skeleton height="120px" borderRadius="md" /> : <CumulativePointsChart history={cumulativeHistory} />}
        </Box>
        <Box flex={1} minW={0}>
          {loadingCumulativeRank ? <Skeleton height="120px" borderRadius="md" /> : <CumulativeRankChart history={cumulativeRankHistory} />}
        </Box>
      </Flex>
    </Box>
  );
}
