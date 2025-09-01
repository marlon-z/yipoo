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
          scope: "read:user user:email repo"
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

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '30');
    const sort = searchParams.get('sort') || 'updated';
    const type = searchParams.get('type') || 'all'; // all, owner, public, private, member
    const search = searchParams.get('search') || '';

    let repositories;

    if (search) {
      // Search repositories
      const searchResponse = await octokit.rest.search.repos({
        q: `${search} user:${session.user?.name || ''}`,
        sort: sort as any,
        per_page,
        page,
      });
      repositories = searchResponse.data.items;
    } else {
      // List user repositories
      const reposResponse = await octokit.rest.repos.listForAuthenticatedUser({
        type: type as any,
        sort: sort as any,
        per_page,
        page,
      });
      repositories = reposResponse.data;
    }

    const formattedRepos = repositories.map(repo => ({
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
    }));

    return NextResponse.json({
      repositories: formattedRepos,
      total_count: search ? repositories.length : undefined,
    });

  } catch (error) {
    console.error('Error fetching repositories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}
