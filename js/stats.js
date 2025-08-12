// stats.js - Sistema de Estatísticas e Rankings

(function() {
    'use strict';
    
    MadNight.stats = {
        // Estatísticas da sessão atual
        current: {
            startTime: null,
            endTime: null,
            totalTime: 0,
            kills: {
                faquinha: 0,  // interno ainda usa faquinha
                morcego: 0,
                caveirinha: 0,
                janis: 0,
                chacal: 0,
                total: 0
            },
            deaths: 0,
            dashesUsed: 0
        },
        
        // Rankings salvos
        highScores: {
            speedRun: [],    // Top 10 tempos mais rápidos
            enemyKills: [],  // Top 10 mais kills
            deathless: []    // Completaram sem morrer
        },
        
        // Configurações
        config: {
            maxScores: 10,
            storageKey: 'madNightHighScores'
        },
        
        // Inicializar sistema
        init: function() {
            console.log('📊 Sistema de estatísticas inicializado');
            this.loadHighScores();
            this.resetCurrent();
        },
        
        // Resetar estatísticas da sessão
        resetCurrent: function() {
            this.current.startTime = Date.now();
            this.current.endTime = null;
            this.current.totalTime = 0;
            this.current.kills = {
                faquinha: 0,  // interno ainda usa faquinha
                morcego: 0,
                caveirinha: 0,
                janis: 0,
                chacal: 0,
                total: 0
            };
            this.current.deaths = 0;
            this.current.dashesUsed = 0;
        },
        
        // Registrar kill
        registerKill: function(enemyType) {
            // Normalizar tipo de inimigo
            const type = enemyType.toLowerCase();
            
            if (this.current.kills.hasOwnProperty(type)) {
                this.current.kills[type]++;
                this.current.kills.total++;
                console.log(`💀 ${type} eliminado! Total: ${this.current.kills.total}`);
            }
        },
        
        // Registrar morte
        registerDeath: function() {
            this.current.deaths++;
        },
        
        // Registrar uso de dash
        registerDash: function() {
            this.current.dashesUsed++;
        },
        
        // Finalizar jogo e calcular estatísticas
        finishGame: function() {
            this.current.endTime = Date.now();
            this.current.totalTime = Math.floor((this.current.endTime - this.current.startTime) / 1000); // em segundos
            
            console.log('🏁 Jogo finalizado!');
            console.log(`⏱️ Tempo: ${this.formatTime(this.current.totalTime)}`);
            console.log(`💀 Kills totais: ${this.current.kills.total}`);
            console.log(`☠️ Mortes: ${this.current.deaths}`);
            
            // Retornar relatório detalhado
            return this.generateReport();
        },
        
        // Gerar relatório final
        generateReport: function() {
            return {
                time: this.current.totalTime,
                timeFormatted: this.formatTime(this.current.totalTime),
                kills: {
                    total: this.current.kills.total,
                    breakdown: {
                        'Piolho': this.current.kills.faquinha,  // Nome público
                        'Morcego': this.current.kills.morcego,
                        'Caveirinha': this.current.kills.caveirinha,
                        'Janis (Pedras)': this.current.kills.janis,
                        'Chacal (Boss)': this.current.kills.chacal
                    }
                },
                deaths: this.current.deaths,
                dashesUsed: this.current.dashesUsed,
                perfect: this.current.deaths === 0
            };
        },
        
        // Verificar se é novo recorde
        checkHighScore: function(report) {
            let newRecords = [];
            
            // Verificar recorde de tempo
            if (this.isTopScore(this.highScores.speedRun, report.time, 'time')) {
                newRecords.push('TEMPO');
            }
            
            // Verificar recorde de kills
            if (this.isTopScore(this.highScores.enemyKills, report.kills.total, 'kills')) {
                newRecords.push('KILLS');
            }
            
            // Verificar run perfeita (sem mortes)
            if (report.perfect) {
                newRecords.push('SEM MORTES');
            }
            
            return newRecords;
        },
        
        // Verificar se entra no top 10
        isTopScore: function(scoreList, value, type) {
            if (scoreList.length < this.config.maxScores) {
                return true;
            }
            
            if (type === 'time') {
                // Menor tempo é melhor
                return value < scoreList[scoreList.length - 1].value;
            } else {
                // Mais kills é melhor
                return value > scoreList[scoreList.length - 1].value;
            }
        },
        
        // Adicionar novo high score
        addHighScore: function(name, report) {
            const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            
            // Adicionar recorde de tempo
            if (this.isTopScore(this.highScores.speedRun, report.time, 'time')) {
                this.highScores.speedRun.push({
                    name: name.toUpperCase(),
                    value: report.time,
                    display: report.timeFormatted,
                    date: date,
                    deaths: report.deaths
                });
                
                // Ordenar por tempo (menor primeiro)
                this.highScores.speedRun.sort((a, b) => a.value - b.value);
                
                // Manter só top 10
                this.highScores.speedRun = this.highScores.speedRun.slice(0, this.config.maxScores);
            }
            
            // Adicionar recorde de kills
            if (this.isTopScore(this.highScores.enemyKills, report.kills.total, 'kills')) {
                this.highScores.enemyKills.push({
                    name: name.toUpperCase(),
                    value: report.kills.total,
                    display: `${report.kills.total} kills`,
                    date: date,
                    time: report.timeFormatted
                });
                
                // Ordenar por kills (maior primeiro)
                this.highScores.enemyKills.sort((a, b) => b.value - a.value);
                
                // Manter só top 10
                this.highScores.enemyKills = this.highScores.enemyKills.slice(0, this.config.maxScores);
            }
            
            // Adicionar run perfeita
            if (report.perfect) {
                this.highScores.deathless.push({
                    name: name.toUpperCase(),
                    time: report.timeFormatted,
                    kills: report.kills.total,
                    date: date
                });
                
                // Ordenar por tempo
                this.highScores.deathless.sort((a, b) => a.time - b.time);
                
                // Manter só top 10
                this.highScores.deathless = this.highScores.deathless.slice(0, this.config.maxScores);
            }
            
            // Salvar no localStorage
            this.saveHighScores();
        },
        
        // Carregar high scores do localStorage
        loadHighScores: function() {
            try {
                const saved = localStorage.getItem(this.config.storageKey);
                if (saved) {
                    const data = JSON.parse(saved);
                    this.highScores = data;
                    console.log('📈 Rankings carregados:', data);
                } else {
                    // Criar estrutura inicial com alguns scores fake para teste
                    this.initializeFakeScores();
                }
            } catch (error) {
                console.error('Erro ao carregar rankings:', error);
                this.initializeFakeScores();
            }
        },
        
        // Salvar high scores no localStorage
        saveHighScores: function() {
            try {
                localStorage.setItem(this.config.storageKey, JSON.stringify(this.highScores));
                console.log('💾 Rankings salvos!');
            } catch (error) {
                console.error('Erro ao salvar rankings:', error);
            }
        },
        
        // Inicializar com scores fake (para teste/demonstração)
        initializeFakeScores: function() {
            this.highScores = {
                speedRun: [
                    {name: 'IMP*', value: 542, display: '9:02', date: '2024-12-15', deaths: 0},
                    {name: 'GAMA', value: 608, display: '10:08', date: '2024-12-14', deaths: 1},
                    {name: 'TATU', value: 645, display: '10:45', date: '2024-12-13', deaths: 0},
                    {name: 'KID_', value: 712, display: '11:52', date: '2024-12-12', deaths: 2},
                    {name: 'KIKO', value: 798, display: '13:18', date: '2024-12-11', deaths: 1},
                    {name: 'PIPO', value: 834, display: '13:54', date: '2024-12-10', deaths: 3},
                    {name: 'DUDU', value: 902, display: '15:02', date: '2024-12-09', deaths: 2},
                    {name: 'SAMY', value: 945, display: '15:45', date: '2024-12-08', deaths: 4}
                ],
                enemyKills: [
                    {name: 'MEND', value: 62, display: '62 kills', date: '2024-12-14', time: '12:30'},
                    {name: 'XARA', value: 58, display: '58 kills', date: '2024-12-13', time: '11:20'},
                    {name: 'KARO', value: 55, display: '55 kills', date: '2024-12-12', time: '14:15'},
                    {name: 'OHAN', value: 51, display: '51 kills', date: '2024-12-11', time: '10:45'},
                    {name: 'IMP*', value: 49, display: '49 kills', date: '2024-12-10', time: '9:02'},
                    {name: 'GAMA', value: 47, display: '47 kills', date: '2024-12-09', time: '10:08'},
                    {name: 'KID_', value: 44, display: '44 kills', date: '2024-12-08', time: '11:52'}
                ],
                deathless: [
                    {name: 'IMP*', time: '9:02', kills: 49, date: '2024-12-15'},
                    {name: 'TATU', time: '10:45', kills: 45, date: '2024-12-13'}
                ]
            };
            
            this.saveHighScores();
        },
        
        // Formatar tempo em MM:SS
        formatTime: function(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        },
        
        // Obter ranking formatado para exibição
        getRankingDisplay: function(type) {
            const rankings = this.highScores[type] || [];
            return rankings.map((score, index) => ({
                position: index + 1,
                ...score
            }));
        },
        
        // Limpar todos os rankings (para debug/reset)
        clearAllScores: function() {
            this.highScores = {
                speedRun: [],
                enemyKills: [],
                deathless: []
            };
            this.saveHighScores();
            console.log('🗑️ Todos os rankings foram limpos');
        }
    };
    
    console.log('Módulo Stats carregado');
    
})();
