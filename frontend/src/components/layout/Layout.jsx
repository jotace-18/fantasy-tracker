import { Flex, Box } from "@chakra-ui/react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }) {
  const handleScrape = () => {
    fetch("http://localhost:4000/api/scrape")
      .then(() => alert("Scraper lanzado 🚀"))
      .catch(() => alert("Error al lanzar scraper ❌"));
  };

  return (
    <Flex>
      <Sidebar />
      <Box flex="1">
        <Topbar onScrape={handleScrape} />
        <Box p={6} bg="gray.50" minH="100vh">
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
