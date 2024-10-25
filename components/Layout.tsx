import React from 'react';
import Head from 'next/head';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import { styled } from '@mui/system';

const StyledAppBar = styled(AppBar)`
  background-color: #ffffff;
  color: #333333;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <Head>
        <title>AI聊天助手</title>
        <meta name="description" content="与AI助手开始智能对话" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <StyledAppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AI聊天助手
          </Typography>
          <Button color="inherit">登录</Button>
          <Button color="inherit">注册</Button>
        </Toolbar>
      </StyledAppBar>
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          {children}
        </Box>
      </Container>
      <Box component="footer" sx={{ bgcolor: 'background.paper', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © 2023 AI聊天助手. 保留所有权利.
          </Typography>
        </Container>
      </Box>
    </>
  );
};

export default Layout;
