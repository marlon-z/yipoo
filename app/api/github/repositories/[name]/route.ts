import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Octokit } from '@octokit/rest';
import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";

const authOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo delete_repo"
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, account }: any) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// 编辑仓库
export async function PATCH(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const octokit = new Octokit({
      auth: session.accessToken,
    });

    const body = await request.json();
    const { name, description, private: isPrivate } = body;
    const currentName = params.name;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Repository name is required' },
        { status: 400 }
      );
    }

    // 获取当前用户信息
    const userResponse = await octokit.rest.users.getAuthenticated();
    const owner = userResponse.data.login;

    // 更新仓库信息
    const updateResponse = await octokit.rest.repos.update({
      owner,
      repo: currentName,
      name: name.trim(),
      description: description?.trim() || '',
      private: Boolean(isPrivate),
    });

    const repo = updateResponse.data;
    const formattedRepo = {
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      fork: repo.fork,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at,
      size: repo.size,
      stargazers_count: repo.stargazers_count,
      watchers_count: repo.watchers_count,
      language: repo.language,
      forks_count: repo.forks_count,
      archived: repo.archived,
      disabled: repo.disabled,
      open_issues_count: repo.open_issues_count,
      license: repo.license,
      default_branch: repo.default_branch,
      topics: repo.topics,
      visibility: repo.visibility,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      owner: {
        login: repo.owner?.login || '',
        avatar_url: repo.owner?.avatar_url || '',
        type: repo.owner?.type || '',
      }
    };

    return NextResponse.json({
      repository: formattedRepo,
      message: 'Repository updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating repository:', error);
    
    // GitHub API 错误处理
    if (error.status === 404) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }
    
    if (error.status === 422) {
      return NextResponse.json(
        { error: 'Repository name already exists or is invalid' },
        { status: 422 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update repository' },
      { status: 500 }
    );
  }
}

// 删除仓库
export async function DELETE(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const octokit = new Octokit({
      auth: session.accessToken,
    });

    const repoName = decodeURIComponent(params.name);
    console.log('删除仓库请求:', { repoName, originalParam: params.name });

    // 获取当前用户信息
    const userResponse = await octokit.rest.users.getAuthenticated();
    const owner = userResponse.data.login;
    console.log('当前认证用户:', {
      login: owner,
      name: userResponse.data.name,
      type: userResponse.data.type,
      id: userResponse.data.id
    });

    // 先检查仓库是否存在以及用户是否有权限
    try {
      const repoInfo = await octokit.rest.repos.get({
        owner,
        repo: repoName,
      });
      console.log('仓库信息:', { 
        name: repoInfo.data.name, 
        owner: repoInfo.data.owner.login,
        permissions: repoInfo.data.permissions,
        canDelete: repoInfo.data.permissions?.admin,
        isOwner: repoInfo.data.owner.login === owner,
        fullName: repoInfo.data.full_name
      });
      
      // 检查是否是仓库拥有者或有管理员权限
      const isOwner = repoInfo.data.owner.login === owner;
      const hasAdminAccess = repoInfo.data.permissions?.admin;
      
      console.log('权限检查结果:', {
        isOwner,
        hasAdminAccess,
        shouldProceed: isOwner || hasAdminAccess
      });
      
      if (!isOwner && !hasAdminAccess) {
        return NextResponse.json(
          { 
            error: `Insufficient permissions to delete repository. You need to be the owner or have admin access. Current user: ${owner}, Repository owner: ${repoInfo.data.owner.login}`,
            details: {
              currentUser: owner,
              repoOwner: repoInfo.data.owner.login,
              isOwner,
              hasAdminAccess,
              permissions: repoInfo.data.permissions
            }
          },
          { status: 403 }
        );
      }
      
      console.log('权限检查通过，继续执行删除操作...');
    } catch (checkError: any) {
      console.error('检查仓库失败:', checkError);
      if (checkError.status === 404) {
        return NextResponse.json(
          { error: 'Repository not found' },
          { status: 404 }
        );
      }
      if (checkError.status === 403) {
        return NextResponse.json(
          { error: 'Access denied. You may not have permission to view this repository.' },
          { status: 403 }
        );
      }
      // 如果检查失败，继续尝试删除（可能是权限问题导致无法获取仓库信息）
      console.log('继续尝试删除，尽管权限检查失败...');
    }

    // 删除仓库
    console.log('调用GitHub API删除仓库:', { owner, repo: repoName });
    await octokit.rest.repos.delete({
      owner,
      repo: repoName,
    });
    
    console.log('仓库删除成功:', repoName);

    return NextResponse.json({
      message: `Repository '${repoName}' deleted successfully`
    });

  } catch (error: any) {
    console.error('Error deleting repository:', {
      status: error.status,
      message: error.message,
      response: error.response?.data,
      documentation_url: error.response?.data?.documentation_url
    });
    
    // GitHub API 错误处理
    if (error.status === 404) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }
    
    if (error.status === 403) {
      return NextResponse.json(
        { 
          error: 'GitHub API returned 403 Forbidden', 
          details: error.response?.data || error.message,
          documentation_url: error.response?.data?.documentation_url
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete repository' },
      { status: 500 }
    );
  }
} 