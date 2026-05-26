package com.quantummesh.auth.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

/**
 * Wires a read-only replica DataSource alongside the primary (auto-configured)
 * one. The replica is bound to {@code spring.datasource.replica.*} and lives
 * under a separate Hikari pool ({@code auth-read-pool}).
 *
 * <p>Repositories still use the primary DataSource by default. The bean is
 * available via {@code @Qualifier("readDataSource")} for the day we route
 * read traffic — keeping the wiring split now means that change is a one-line
 * repository edit, not a schema rework.
 *
 * <p>If no real replica URL is set, both pools point at the same database.
 * This keeps dev simple while making the pattern visible in the code.
 */
@Configuration
public class DataSourceConfig {

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties primaryDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource.hikari")
    public DataSource dataSource(DataSourceProperties props) {
        return props.initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
    }

    @Bean
    @ConfigurationProperties("spring.datasource.replica")
    public ReplicaDataSourceProperties replicaProperties() {
        return new ReplicaDataSourceProperties();
    }

    @Bean(name = "readDataSource", destroyMethod = "close")
    public DataSource readDataSource(ReplicaDataSourceProperties props) {
        HikariDataSource ds = DataSourceBuilder.create()
                .type(HikariDataSource.class)
                .driverClassName(props.getDriverClassName())
                .url(props.getUrl())
                .username(props.getUsername())
                .password(props.getPassword())
                .build();
        if (props.getHikari() != null) {
            ReplicaDataSourceProperties.Hikari h = props.getHikari();
            if (h.getPoolName() != null) ds.setPoolName(h.getPoolName());
            if (h.getMaximumPoolSize() > 0) ds.setMaximumPoolSize(h.getMaximumPoolSize());
            if (h.getMinimumIdle() >= 0) ds.setMinimumIdle(h.getMinimumIdle());
            if (h.getConnectionTimeout() > 0) ds.setConnectionTimeout(h.getConnectionTimeout());
            if (h.getIdleTimeout() > 0) ds.setIdleTimeout(h.getIdleTimeout());
            if (h.getMaxLifetime() > 0) ds.setMaxLifetime(h.getMaxLifetime());
            ds.setReadOnly(h.isReadOnly());
        } else {
            ds.setReadOnly(true);
        }
        return ds;
    }

    public static class ReplicaDataSourceProperties {
        private String url;
        private String username;
        private String password;
        private String driverClassName;
        private Hikari hikari = new Hikari();

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getDriverClassName() { return driverClassName; }
        public void setDriverClassName(String driverClassName) { this.driverClassName = driverClassName; }
        public Hikari getHikari() { return hikari; }
        public void setHikari(Hikari hikari) { this.hikari = hikari; }

        public static class Hikari {
            private String poolName;
            private int maximumPoolSize;
            private int minimumIdle = -1;
            private long connectionTimeout;
            private long idleTimeout;
            private long maxLifetime;
            private boolean readOnly = true;

            public String getPoolName() { return poolName; }
            public void setPoolName(String poolName) { this.poolName = poolName; }
            public int getMaximumPoolSize() { return maximumPoolSize; }
            public void setMaximumPoolSize(int maximumPoolSize) { this.maximumPoolSize = maximumPoolSize; }
            public int getMinimumIdle() { return minimumIdle; }
            public void setMinimumIdle(int minimumIdle) { this.minimumIdle = minimumIdle; }
            public long getConnectionTimeout() { return connectionTimeout; }
            public void setConnectionTimeout(long connectionTimeout) { this.connectionTimeout = connectionTimeout; }
            public long getIdleTimeout() { return idleTimeout; }
            public void setIdleTimeout(long idleTimeout) { this.idleTimeout = idleTimeout; }
            public long getMaxLifetime() { return maxLifetime; }
            public void setMaxLifetime(long maxLifetime) { this.maxLifetime = maxLifetime; }
            public boolean isReadOnly() { return readOnly; }
            public void setReadOnly(boolean readOnly) { this.readOnly = readOnly; }
        }
    }
}
