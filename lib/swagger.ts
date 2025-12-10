export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Game Web App API',
    description: 'API for the comprehensive game web application with real-time game features',
    version: '1.0.0',
    contact: {
      name: 'Game Team',
      url: 'http://localhost:3000',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development server',
    },
  ],
  tags: [
    {
      name: 'Rooms',
      description: 'Game room management endpoints',
    },
    {
      name: 'Players',
      description: 'Player management within rooms',
    },
    {
      name: 'Games',
      description: 'Game management within rooms',
    },
  ],
  paths: {
    '/rooms': {
      post: {
        tags: ['Rooms'],
        summary: 'Create a new game room',
        description: 'Create a new game room with configuration',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'mainColor', 'maxPlayers', 'pointMode', 'createdBy', 'pointFrom', 'pointTo'],
                properties: {
                  name: {
                    type: 'string',
                    example: 'Quiz Night #1',
                    description: 'Room display name',
                  },
                  mainColor: {
                    type: 'string',
                    example: '#3b82f6',
                    description: 'Primary color for the room (hex format)',
                  },
                  colorFrom: {
                    type: 'string',
                    example: '#10b981',
                    description: 'Gradient color start (hex format)',
                  },
                  colorTo: {
                    type: 'string',
                    example: '#1e40af',
                    description: 'Gradient color end (hex format)',
                  },
                  maxPlayers: {
                    type: 'integer',
                    example: 10,
                    minimum: 1,
                    description: 'Maximum number of players allowed',
                  },
                  pointMode: {
                    type: 'integer',
                    enum: [1, 2],
                    example: 1,
                    description: 'Point calculation mode (1: linear, 2: proportional)',
                  },
                  pointFrom: {
                    type: 'integer',
                    example: 0,
                    description: 'Minimum points',
                  },
                  pointTo: {
                    type: 'integer',
                    example: 100,
                    description: 'Maximum points',
                  },
                  createdBy: {
                    type: 'string',
                    format: 'uuid',
                    example: '550e8400-e29b-41d4-a716-446655440000',
                    description: 'Admin/Creator user ID',
                  },
                },
              },
              example: {
                name: 'Quiz Night #1',
                mainColor: '#3b82f6',
                colorFrom: '#10b981',
                colorTo: '#1e40af',
                maxPlayers: 10,
                pointMode: 1,
                pointFrom: 0,
                pointTo: 100,
                createdBy: '550e8400-e29b-41d4-a716-446655440000',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Room created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    join_code: { type: 'string' },
                    presentation_code: { type: 'string' },
                    main_color: { type: 'string' },
                    max_players: { type: 'integer' },
                    created_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid request parameters' },
          500: { description: 'Server error' },
        },
      },
    },
    '/rooms/{roomId}': {
      get: {
        tags: ['Rooms'],
        summary: 'Get room details',
        parameters: [
          {
            name: 'roomId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Room details retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    join_code: { type: 'string' },
                    presentation_code: { type: 'string' },
                    main_color: { type: 'string' },
                    max_players: { type: 'integer' },
                    created_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          404: { description: 'Room not found' },
        },
      },
    },
    '/rooms/{roomId}/players': {
      get: {
        tags: ['Players'],
        summary: 'Get all players in a room',
        parameters: [
          {
            name: 'roomId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Players list retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      score: { type: 'integer' },
                      rank: { type: 'integer' },
                      joined_at: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Room not found' },
        },
      },
      post: {
        tags: ['Players'],
        summary: 'Add a player to a room',
        parameters: [
          {
            name: 'roomId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: {
                    type: 'string',
                    example: 'John Doe',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Player added successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    score: { type: 'integer' },
                    rank: { type: 'integer' },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid request or room at capacity' },
          404: { description: 'Room not found' },
        },
      },
    },
    '/rooms/{roomId}/players/{playerId}': {
      get: {
        tags: ['Players'],
        summary: 'Get player details',
        parameters: [
          {
            name: 'roomId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'playerId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Player details retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    score: { type: 'integer' },
                    rank: { type: 'integer' },
                  },
                },
              },
            },
          },
          404: { description: 'Player not found' },
        },
      },
      patch: {
        tags: ['Players'],
        summary: 'Update player data',
        parameters: [
          {
            name: 'roomId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'playerId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  score: { type: 'integer' },
                  rank: { type: 'integer' },
                },
              },
              example: { score: 100, rank: 1 },
            },
          },
        },
        responses: {
          200: { description: 'Player updated successfully' },
          404: { description: 'Player not found' },
        },
      },
      delete: {
        tags: ['Players'],
        summary: 'Delete a player',
        parameters: [
          {
            name: 'roomId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'playerId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Player deleted successfully' },
          404: { description: 'Player not found' },
        },
      },
    },
    '/rooms/{roomId}/games': {
      get: {
        tags: ['Games'],
        summary: 'Get all games in a room',
        parameters: [
          {
            name: 'roomId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Games list retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      type: { type: 'string', enum: ['weight', 'random'] },
                      status: { type: 'string', enum: ['pending', 'active', 'completed'] },
                      game_order: { type: 'integer' },
                      created_at: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Room not found' },
        },
      },
      post: {
        tags: ['Games'],
        summary: 'Create a new game',
        parameters: [
          {
            name: 'roomId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type'],
                properties: {
                  type: {
                    type: 'string',
                    enum: ['weight', 'random'],
                    example: 'weight',
                  },
                  name: {
                    type: 'string',
                    example: 'Guessing Game Round 1',
                  },
                  settings: {
                    type: 'object',
                    example: { mode: 'test' },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Game created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    type: { type: 'string' },
                    status: { type: 'string' },
                    game_order: { type: 'integer' },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid game type' },
          404: { description: 'Room not found' },
        },
      },
    },
    '/rooms/{roomId}/games/{gameId}': {
      get: {
        tags: ['Games'],
        summary: 'Get game details',
        parameters: [
          {
            name: 'roomId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'gameId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Game details retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    type: { type: 'string' },
                    status: { type: 'string' },
                    settings: { type: 'object' },
                  },
                },
              },
            },
          },
          404: { description: 'Game not found' },
        },
      },
      patch: {
        tags: ['Games'],
        summary: 'Update game status',
        parameters: [
          {
            name: 'roomId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'gameId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['pending', 'active', 'completed'],
                    example: 'active',
                  },
                  settings: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Game updated successfully' },
          404: { description: 'Game not found' },
        },
      },
      delete: {
        tags: ['Games'],
        summary: 'Delete a game',
        parameters: [
          {
            name: 'roomId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'gameId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Game deleted successfully' },
          404: { description: 'Game not found' },
        },
      },
    },
  },
  components: {
    schemas: {
      Room: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          join_code: { type: 'string' },
          presentation_code: { type: 'string' },
          main_color: { type: 'string' },
          max_players: { type: 'integer' },
          point_mode: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Player: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          score: { type: 'integer' },
          rank: { type: 'integer' },
          joined_at: { type: 'string', format: 'date-time' },
        },
      },
      Game: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          type: { type: 'string', enum: ['weight', 'random'] },
          status: { type: 'string', enum: ['pending', 'active', 'completed'] },
          game_order: { type: 'integer' },
          settings: { type: 'object' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};
